# VidProof - AI-Powered Video Proof Verification Platform

A modern web application for AI-powered video verification and authenticity analysis using React, Firebase, and free open-source AI models that run in the browser.

![VidProof](https://img.shields.io/badge/VidProof-AI%20Video%20Verification-blue)
![React](https://img.shields.io/badge/React-18.2.0-61DAFB)
![Firebase](https://img.shields.io/badge/Firebase-Backend-FFCA28)
![TypeScript](https://img.shields.io/badge/TypeScript-4.9.5-3178C6)

## 🚀 Features

- **User Authentication**: Secure authentication with Firebase Auth (Email/Password and Google)
- **Video Upload**: Support for MP4, MOV, and AVI formats (max 100MB)
- **AI-Powered Analysis**:
  - Deepfake detection
  - Speech-to-text extraction
  - Sentiment analysis
  - Tampering detection
- **Verification Reports**: Comprehensive reports with authenticity scores
- **PDF Export**: Download detailed verification reports as PDF
- **Glassmorphism UI**: Modern, sleek interface with frosted glass effects

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Glassmorphism CSS with Tailwind-inspired utilities
- **Backend**: Firebase (Auth, Firestore); videos are analysed in the browser and not stored
- **AI Models**: Free open-source models run locally in the browser via Transformers.js (no API key): `Deep-Fake-Detector-v2` (deepfake detection), `whisper-tiny` (speech-to-text), `distilbert-sst-2` (sentiment)
- **Deployment**: Vercel (Frontend) + Firebase (Backend)

## 📋 Prerequisites

- Node.js 16+ and npm/yarn
- Firebase project
- Vercel account (for deployment)

## 🔧 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/vidproof.git
cd vidproof
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Firebase

1. Create a project in the [Firebase console](https://console.firebase.google.com)
2. Add a Web app and copy its config values into `.env`
3. Authentication → Sign-in method: enable **Email/Password** and **Google**
4. Create a Firestore database
5. Deploy the security rules:

```bash
firebase deploy --only firestore:rules
```

6. Authentication → Settings → Authorized domains: add your Vercel domain

### 4. AI models

Nothing to configure. The models (about 200MB in total) are downloaded from the Hugging Face Hub the first time a video is analysed, then cached by the browser. Analysis runs on the user's device, so videos are never uploaded anywhere.

### 5. Environment Variables

Create a `.env` file in the root directory:

```env
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id

# App Configuration
REACT_APP_MAX_FILE_SIZE=104857600
REACT_APP_ALLOWED_FILE_TYPES=video/mp4,video/quicktime,video/x-msvideo
```

### 6. Run Development Server

```bash
npm start
```

The app will be available at `http://localhost:3000`

3. Set environment variables in Vercel dashboard

Reports are kept for the period chosen at upload (90, 60, 30, 14 or 7 days). Expired documents are hidden immediately and deleted when the owner next signs in (Firestore TTL policies need the Blaze plan; if you upgrade, enable a TTL policy on `expires_at` for `video_uploads` and `verification_reports`).

## 📁 Project Structure

```
vidproof/
├── public/              # Static assets
├── src/
│   ├── components/      # React components
│   ├── contexts/        # Context providers
│   ├── lib/            # Firebase client
│   ├── pages/          # Page components
│   ├── services/       # AI service integration
│   └── styles/         # Global styles
├── firestore.rules     # Firestore security rules
├── .env.example        # Environment variables template
├── package.json        # Dependencies
└── README.md          # Documentation
```

## 🔐 Security Features

- Row Level Security (RLS) enabled on all tables
- Secure file upload with user isolation
- API key protection with environment variables
- Authentication required for all operations

## 🎨 UI Features

- Glassmorphism design with blur effects
- Responsive layout for all devices
- Smooth animations with Framer Motion
- Interactive charts for data visualization
- Real-time upload progress tracking

## 📊 AI Models Used

- **Deepfake Detection**: `umm-maybe/AI-image-detector`
- **Speech-to-Text**: `openai/whisper-base`
- **Sentiment Analysis**: `distilbert-base-uncased-finetuned-sst-2-english`

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions, please create an issue in the GitHub repository.

---

Built with ❤️ using React, Firebase, and Transformers.js
