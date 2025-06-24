# AI Interview Setup Guide

This guide explains how to set up the AI-powered interview functionality in your recruitment platform.

## Prerequisites

1. **Google Gemini API Key**: You need a Google AI Studio API key for the Gemini model
2. **MongoDB**: Ensure your MongoDB is running
3. **Node.js**: Version 14 or higher

## Environment Variables

Add the following environment variables to your `.env` file in the backend directory:

```env
# Google Gemini AI (Required for interview functionality)
GEMINI_API_KEY=your-gemini-api-key-here

# Other existing variables...
MONGODB_URI=mongodb://localhost:27017/recruitment-platform
JWT_SECRET=your-jwt-secret-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
PORT=5000
```

## Getting Google Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key
5. Add it to your `.env` file as `GEMINI_API_KEY`

## Installation

1. Install the new dependency:
```bash
cd app/backend
npm install @google/generative-ai
```

2. Restart your backend server:
```bash
npm run dev
```

## How It Works

### Admin Flow:
1. Admin shortlists candidates for a job
2. Admin goes to "Interview Setup" page
3. Admin selects a job with "Interview Pending" status
4. Admin enters the tech stack for the job
5. AI generates 2 technical questions based on the job requirements
6. Interview is ready for candidates

### Candidate Flow:
1. Shortlisted candidates see "Start Interview" button in their applications
2. Candidate clicks "Start Interview" to begin
3. Candidate answers questions using speech recognition
4. AI provides real-time feedback and ratings
5. Candidate receives comprehensive feedback after completion

## Features

- **AI Question Generation**: Questions are automatically generated based on job requirements
- **Speech Recognition**: Candidates can answer questions verbally
- **Real-time Feedback**: AI provides instant feedback on each answer
- **Rating System**: 1-10 rating scale for each answer
- **Overall Assessment**: Comprehensive feedback at the end
- **Progress Tracking**: Visual progress indicator during interview

## API Endpoints

- `POST /api/interviews/setup` - Setup interview for a job
- `POST /api/interviews/start` - Start interview for a candidate
- `POST /api/interviews/submit-answer` - Submit answer for a question
- `POST /api/interviews/complete` - Complete an interview
- `GET /api/interviews/:interviewId` - Get interview details
- `GET /api/interviews/job/:jobId` - Get interviews for a job
- `GET /api/interviews/candidate/:candidateId` - Get interviews for a candidate

## Database Models

### Interview Model
```javascript
{
  job: ObjectId,
  candidate: ObjectId,
  application: ObjectId,
  questions: [{ question: String, answer: String }],
  status: String, // 'Pending', 'In Progress', 'Completed'
  overallRating: Number,
  feedback: String,
  startedAt: Date,
  completedAt: Date
}
```

### InterviewResponse Model
```javascript
{
  interview: ObjectId,
  question: String,
  correctAnswer: String,
  userAnswer: String,
  feedback: String,
  rating: Number // 1-10
}
```

## Troubleshooting

1. **Speech Recognition Not Working**: Ensure you're using a modern browser (Chrome, Firefox, Safari)
2. **AI Not Responding**: Check your Gemini API key and internet connection
3. **Questions Not Generating**: Verify the job has proper description and tech stack
4. **Interview Not Starting**: Ensure the candidate is shortlisted for the job

## Security Notes

- Speech recognition runs client-side and is not recorded
- AI responses are processed server-side
- All interview data is stored securely in MongoDB
- API keys should be kept secure and not committed to version control 