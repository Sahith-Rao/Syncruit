# Interview Response Analyzer

A MERN stack application that analyzes video interview responses using AI to provide feedback on delivery metrics such as eye contact, confidence, speech clarity, and more.

## Features

- Video upload and analysis
- Real-time feedback on:
  - Eye contact
  - Confidence level
  - Speech clarity and rate
  - Filler words usage
  - Facial expressions
- Detailed feedback comments
- Overall delivery score

## Prerequisites

- Node.js (v14 or higher)
- Python 3.7 or higher
- MongoDB (optional, for future database integration)

## Python Dependencies

```bash
pip install opencv-python numpy deepface moviepy SpeechRecognition imageio imageio-ffmpeg
```

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd interview-analyzer
```

2. Install server dependencies:
```bash
cd server
npm install
```

3. Install client dependencies:
```bash
cd ../client
npm install
```

## Running the Application

1. Start the server:
```bash
cd server
npm run dev
```

2. Start the client:
```bash
cd client
npm start
```

The application will be available at `http://localhost:3000`

## Usage

1. Open the application in your web browser
2. Click "Select Video" to upload your interview response video
3. Wait for the analysis to complete
4. View your detailed feedback and metrics
5. Use the feedback to improve your interview delivery

## Technical Details

- Frontend: React with TypeScript and Material-UI
- Backend: Node.js with Express
- Video Analysis: Python with OpenCV, DeepFace, and SpeechRecognition
- File Upload: Multer for handling video uploads

## Future Improvements

- User authentication and history
- Database integration for storing results
- More detailed analysis metrics
- Custom feedback templates
- Batch processing for multiple videos 