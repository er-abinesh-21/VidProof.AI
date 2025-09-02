# VidProof - AI-Powered Video Proof Verification Platform

A modern web application for AI-powered video verification and authenticity analysis using React, Supabase, and Hugging Face AI models.

![VidProof](https://img.shields.io/badge/VidProof-AI%20Video%20Verification-blue)
![React](https://img.shields.io/badge/React-18.2.0-61DAFB)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E)
![TypeScript](https://img.shields.io/badge/TypeScript-4.9.5-3178C6)

## 🚀 Features

- **User Authentication**: Secure authentication with Supabase Auth (Email/Password)
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
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **AI Models**: Hugging Face Inference API
- **Deployment**: Vercel (Frontend) + Supabase Cloud (Backend)

## 📋 Prerequisites

- Node.js 16+ and npm/yarn
- Supabase account
- Hugging Face account with API key
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

### 3. Configure Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings → API to get your project URL and anon key
3. Run the SQL schema in your Supabase SQL editor:

```sql
-- Copy contents from supabase/schema.sql
```

### 4. Configure Hugging Face

1. Create an account at [huggingface.co](https://huggingface.co)
2. Go to Settings → Access Tokens
3. Create a new token with read permissions

### 5. Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase Configuration
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key

# Hugging Face API
REACT_APP_HUGGINGFACE_API_KEY=your_huggingface_api_key

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

### Configure Supabase

Your Supabase project is already configured and hosted. Make sure to:
1. Enable email confirmations in Authentication settings
2. Configure storage policies if needed
3. Set up custom domain (optional)

## 📁 Project Structure

```
vidproof/
├── public/              # Static assets
├── src/
│   ├── components/      # React components
│   ├── contexts/        # Context providers
│   ├── lib/            # Supabase client
│   ├── pages/          # Page components
│   ├── services/       # AI service integration
│   └── styles/         # Global styles
├── supabase/           # Database schema
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

Built with ❤️ using React, Supabase, and Hugging Face AI
