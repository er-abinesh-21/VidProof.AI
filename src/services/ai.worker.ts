// Runs the AI models off the main thread. Models are downloaded from the Hugging Face Hub on first use
// (free, no API key) and cached by the browser; all inference happens locally on the user's device.
import { pipeline, env } from '@huggingface/transformers';

env.allowLocalModels = false;

const MODELS = {
  deepfake: 'onnx-community/Deep-Fake-Detector-v2-Model-ONNX', // labels: Realism / Deepfake
  whisper: 'Xenova/whisper-tiny',
  sentiment: 'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
};

const ctx: any = globalThis;
const loaded: Record<string, Promise<any>> = {};

// Pipelines are loaded once and reused for every later request
const load = (task: string, model: string): Promise<any> => {
  if (!loaded[model]) {
    loaded[model] = (pipeline as any)(task, model, { dtype: 'q8' }).catch((error: unknown) => {
      delete loaded[model]; // allow a retry after a failed download
      throw error;
    });
  }
  return loaded[model];
};

const handlers: Record<string, (payload: any) => Promise<unknown>> = {
  // Returns the AI-generated probability (0-1) of each frame
  deepfake: async ({ frames }: { frames: string[] }) => {
    const classifier = await load('image-classification', MODELS.deepfake);
    const probabilities: number[] = [];
    for (const frame of frames) {
      const output: { label: string; score: number }[] = await classifier(frame, { top_k: 2 });
      const fake = output.find((o) => /fake/i.test(o.label));
      if (fake) probabilities.push(fake.score);
    }
    return probabilities;
  },

  // Returns the transcript of 16kHz mono audio
  transcribe: async ({ audio }: { audio: Float32Array }) => {
    const transcriber = await load('automatic-speech-recognition', MODELS.whisper);
    const output = await transcriber(audio, { chunk_length_s: 30, stride_length_s: 5 });
    return typeof output?.text === 'string' ? output.text.trim() : '';
  },

  // Returns the label/score pairs for a piece of text
  sentiment: async ({ text }: { text: string }) => {
    const classifier = await load('text-classification', MODELS.sentiment);
    return classifier(text, { top_k: 2 });
  }
};

ctx.onmessage = async (event: MessageEvent) => {
  const { id, task, payload } = event.data;
  try {
    const result = await handlers[task](payload);
    ctx.postMessage({ id, result });
  } catch (error: any) {
    ctx.postMessage({ id, error: String(error?.message || error) });
  }
};
