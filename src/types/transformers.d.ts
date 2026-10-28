// TypeScript 4.9 (used by react-scripts 5) can't parse this package's bundled .d.ts files.
// The library is only used inside ai.worker.ts, which treats the pipelines as `any`.
declare module '@huggingface/transformers';
