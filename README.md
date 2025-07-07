# Syncruit - Where Talent and Hiring Sync Perfectly

Syncruit is an AI-powered recruitment platform that streamlines the hiring process for both employers and job seekers. The platform offers a comprehensive suite of tools for job posting, application management, resume analysis, and AI-driven interviews.


## 🚀 Features

### For Employers
- **Job Management**: Create, edit, and manage job listings with detailed requirements
- **Application Tracking**: Review and track applications with status updates
- **NLP Resume Analysis**: Automatically score and evaluate candidate resumes using Natural Language Processing
- **Interview Management**: Set up and review video interviews with comprehensive analysis
- **Analytics Dashboard**: Track recruitment metrics and make data-driven decisions
- **Candidate Selection**: Streamlined workflow from application to final selection

### For Job Seekers
- **Profile Management**: Create and maintain professional profiles
- **Job Discovery**: Browse and apply for relevant opportunities
- **Application Tracking**: Monitor application status in real-time
- **Mock Interviews**: Practice with mock interviews that provide detailed feedback on both content and delivery    metrics (confidence, speech rate, eye contact)
- **Video Interviews**: Complete asynchronous video interviews with comprehensive evaluation
- **Skill Development**: Receive actionable feedback to improve interview performance

## 🛠️ Technology Stack

### Frontend
- **Next.js**: React framework for server-side rendering and static site generation
- **TypeScript**: Type-safe JavaScript for improved developer experience
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Lucide Icons**: Beautiful, consistent icons

### Backend
- **Node.js**: JavaScript runtime for server-side logic
- **Express.js**: Web framework for handling API requests
- **MongoDB**: NoSQL database for flexible data storage
- **Mongoose**: ODM for MongoDB schema definition and validation
- **JWT**: Authentication and authorization

### AI & Media
- **Google Generative AI (Gemini)**: For generating interview questions and evaluating answer content (60% of overall score)
- **Python**: Custom HR analytics scripts (hr_analyzer.py) for evaluating delivery metrics:
  - Confidence measurement (20% of overall score)
  - Speech rate analysis (20% of overall score) 
  - Eye contact detection
- **MediaRecorder API**: For capturing video interviews
- **SpeechRecognition API**: For transcribing interview responses
- **Cloudinary**: Cloud storage for video uploads

## 🧠 Analysis Processes

### Resume Analysis Process

Syncruit uses sophisticated Natural Language Processing (NLP) techniques to analyze resumes and match them to job requirements:

1. **Text Extraction**: 
   - Uses PyPDF2 to extract text content from PDF resumes
   - Processes the extracted text to identify key information

2. **Entity Recognition**:
   - Employs spaCy's Named Entity Recognition (NER) to extract candidate information
   - Identifies emails, names, and other personal details using regular expressions

3. **Semantic Matching**:
   - Converts both the resume and job description to TF-IDF vectors
   - TF-IDF (Term Frequency-Inverse Document Frequency) weights the importance of terms
   - Terms that are rare across documents but frequent in a specific document receive higher weights
   - Common words that appear in many documents receive lower weights

4. **Similarity Calculation**:
   - Calculates cosine similarity between the resume and job description vectors
   - Measures the cosine of the angle between vectors (higher value = more similar)
   - Normalizes the similarity score to a 0-100 scale
   - Higher scores indicate better matches between candidate skills and job requirements

### Interview Analysis Process

Syncruit employs a dual-analysis approach to evaluate interview responses:

1. **Content Analysis (60% of overall score)**:
   - Powered by Google Generative AI (Gemini)
   - Evaluates the substance and quality of answers
   - Analyzes relevance to the question
   - Assesses completeness and accuracy of responses
   - Measures depth of knowledge and critical thinking

2. **Delivery Analysis (40% of overall score)**:
   - Powered by custom Python scripts (hr_analyzer.py)
   - Uses computer vision and audio processing:
     - **OpenCV**: For video frame processing
     - **DeepFace**: For facial expression analysis
     - **SpeechRecognition**: For transcribing speech
     - **MoviePy**: For audio extraction and processing

   - **Key Metrics Analyzed**:
     - **Eye Contact (30% of delivery score)**: Tracks face position relative to camera
     - **Confidence (30% of delivery score)**: Based on positive facial expressions
     - **Speech Clarity (20% of delivery score)**: Evaluates clarity of speech
     - **Filler Words (-10% impact)**: Counts usage of "um", "uh", "like", etc.
     - **Pauses (-10% impact)**: Detects long pauses (>1 second) in speech
     - **Speech Rate**: Measures words per minute (ideal: 110-150 WPM)
     - **Facial Expressions**: Analyzes emotions displayed during the interview

   - **Feedback Generation**:
     - Provides quantitative scores for each metric
     - Generates qualitative feedback with specific improvement suggestions
     - Identifies dominant facial expressions and speech patterns

This comprehensive analysis provides candidates with actionable feedback to improve both the substance of their answers and their presentation skills, while giving employers deeper insights into candidate suitability beyond just resume qualifications.


## 🔄 Workflow

### Employer Workflow
1. Post job listings with requirements and deadlines
2. Review applications and AI-generated resume scores
3. Shortlist candidates for interviews
4. Set up interview questions and deadlines
5. Review completed interviews with AI-generated scores and feedback
6. Make final selection decisions

### Candidate Workflow
1. Create profile and upload resume
2. Browse and apply for jobs
3. Practice with mock interviews to improve skills
4. Complete video interviews for job applications
5. Track application status and receive notifications
6. Accept job offers

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/syncruit.git
cd syncruit
```

2. Install backend dependencies
```bash
cd app/backend
npm install
```

3. Install frontend dependencies
```bash
cd ../frontend
npm install
```

4. Set up environment variables
Create a `.env` file in the root directory with the following variables:
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

5. Start the development servers

Backend:
```bash
cd app/backend
npm run dev
```

Frontend:
```bash
cd app/frontend
npm run dev
```

6. Access the application at `http://localhost:3000`