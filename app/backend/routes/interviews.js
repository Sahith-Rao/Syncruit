import express from 'express';
import Interview from '../models/Interview.js';
import InterviewResponse from '../models/InterviewResponse.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import mongoose from 'mongoose';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Initialize Google AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  }
});

// Helper function to upload to Cloudinary
const uploadToCloudinary = (filePath) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(filePath, 
      { 
        resource_type: "video",
        folder: "interview_videos",
        use_filename: true,
        unique_filename: true
      }, 
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
  });
};

// Helper function to clean AI response
const cleanJsonResponse = (responseText) => {
  let cleanText = responseText.trim();
  cleanText = cleanText.replace(/(json|```|`)/gi, "");
  // Remove all control characters except for \n, \r, \t
  cleanText = cleanText.replace(/[\u0000-\u0019]+/g, "");
  // Replace unescaped newlines in string values with spaces
  cleanText = cleanText.replace(/:(\s*)"([^"]*?)\n([^"]*?)"/g, (match, p1, p2, p3) => `:${p1}"${p2} ${p3}"`);
  // Try to extract the first [...] block
  const jsonArrayMatch = cleanText.match(/\[.*\]/s);
  if (jsonArrayMatch) {
    cleanText = jsonArrayMatch[0];
  } else {
    throw new Error("No JSON array found in response");
  }
  try {
    return JSON.parse(cleanText);
  } catch (error) {
    console.error('Failed to parse cleaned Gemini JSON:', cleanText);
    throw new Error("Invalid JSON format: " + error.message);
  }
};

// Helper function to clean AI response for a single JSON object
const cleanJsonObjectResponse = (responseText) => {
  // First, try direct JSON parsing
  try {
    return JSON.parse(responseText);
  } catch (e) {
    // If direct parsing fails, try cleaning the text
    console.log("Direct JSON parsing failed, trying to clean the text...");
  }

  // Basic cleaning
  let cleanText = responseText.trim();
  cleanText = cleanText.replace(/(json|```|`)/gi, "");
  
  // Try to extract the JSON object using regex
  const jsonMatch = cleanText.match(/{[\s\S]*}/);
  if (jsonMatch) {
    cleanText = jsonMatch[0];
    
    // Try parsing the extracted JSON
    try {
      return JSON.parse(cleanText);
    } catch (e) {
      console.log("Extracted JSON parsing failed, trying more advanced cleaning...");
    }
  }
  
  // More advanced cleaning for complex JSON with newlines in strings
  try {
    // Process the text character by character to handle string boundaries properly
    let inString = false;
    let processedText = '';
    let i = 0;
    
    // Temporarily replace escaped quotes to avoid confusion
    cleanText = cleanText.replace(/\\"/g, "___ESCAPED_QUOTE___");
    
    while (i < cleanText.length) {
      const char = cleanText[i];
      
      if (char === '"' && (i === 0 || cleanText[i-1] !== '\\')) {
        inString = !inString;
      }
      
      // Replace newlines with spaces only within strings
      if (inString && (char === '\n' || char === '\r')) {
        processedText += ' ';
      } else {
        processedText += char;
      }
      
      i++;
    }
    
    // Restore escaped quotes
    processedText = processedText.replace(/___ESCAPED_QUOTE___/g, '\\"');
    
    // Remove trailing commas before closing brackets or braces
    processedText = processedText.replace(/,(\s*[\]}])/g, '$1');
    
    // Try parsing the processed text
    try {
      return JSON.parse(processedText);
    } catch (e) {
      console.log("Advanced cleaning failed, trying to extract fields directly...");
    }
    
    // If all parsing attempts fail, try to extract just the ratings and feedback fields
    const ratingsMatch = processedText.match(/"ratings"\s*:\s*([0-9.]+)/);
    const feedbackMatch = processedText.match(/"feedback"\s*:\s*"([^"]+)"/);
    
    if (ratingsMatch && feedbackMatch) {
      return {
        ratings: parseFloat(ratingsMatch[1]),
        feedback: feedbackMatch[1]
      };
    }
  } catch (error) {
    console.error("Error during advanced JSON cleaning:", error);
  }
  
  // If all else fails, return a default response to prevent crashing
  console.error("All JSON parsing attempts failed. Using default response.");
  return {
    ratings: 5,
    feedback: "Unable to parse AI response. Please try again."
  };
};

// Generate AI questions for a job
const generateQuestions = async (jobData) => {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  
  const prompt = `
    As an experienced prompt engineer, generate a JSON array containing 2 technical interview questions along with detailed answers based on the following job information. Each object in the array should have the fields "question" and "answer", formatted as follows:

    [
      { "question": "<Question text>", "answer": "<Answer text>" },
      { "question": "<Question text>", "answer": "<Answer text>" }
    ]

    Job Information:
    - Job Position: ${jobData.title}
    - Job Description: ${jobData.description || 'Not specified'}
    - Years of Experience Required: ${jobData.experience || 'Not specified'}
    - Tech Stacks/Skills: ${jobData.techStack || jobData.skillsRequired?.join(', ') || 'General development'}
    - Requirements: ${jobData.requirements || 'Not specified'}

    The questions should assess:
    1. Technical skills relevant to the position
    2. Problem-solving abilities
    3. Best practices in the field
    4. Practical experience with the mentioned technologies

    Please format the output strictly as an array of JSON objects without any additional labels, code blocks, or explanations. Return only the JSON array with questions and answers.
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return cleanJsonResponse(response.text());
};

// POST /api/interviews/setup - Setup interview for a job
router.post('/setup', async (req, res) => {
  try {
    const { jobId, techStack, deadline } = req.body;
    
    if (!jobId) {
      return res.status(400).json({ error: 'Job ID is required' });
    }

    if (!techStack || !techStack.trim()) {
      return res.status(400).json({ error: 'Tech stack is required' });
    }

    if (!deadline) {
      return res.status(400).json({ error: 'Interview deadline is required' });
    }

    // Get the job details
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if there are shortlisted candidates for this job
    const shortlistedApplications = await Application.find({ 
      job: jobId, 
      shortlisted: true 
    });

    if (shortlistedApplications.length === 0) {
      return res.status(400).json({ error: 'No shortlisted candidates found for this job' });
    }

    // Update job with tech stack, interview status, and interview deadline
    const updatedJob = await Job.findByIdAndUpdate(
      jobId,
      { 
        techStack: techStack.trim(),
        interviewStatus: 'Ready',
        status: 'Interviews Open',
        interviewDeadline: new Date(deadline)
      },
      { new: true }
    );

    // Generate questions using AI with the specified tech stack
    const questions = await generateQuestions(updatedJob);

    res.json({ 
      message: 'Interview posted successfully',
      job: updatedJob,
      questions: questions,
      shortlistedCount: shortlistedApplications.length
    });
  } catch (error) {
    console.error('Error setting up interview:', error);
    res.status(500).json({ error: 'Failed to setup interview' });
  }
});

// GET /api/interviews/job/:jobId - Get interviews for a specific job
router.get('/job/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({ error: 'Invalid Job ID format' });
    }

    const interviews = await Interview.find({ job: jobId })
      .populate('candidate')
      .populate('application')
      .sort({ createdAt: -1 });

    res.json(interviews);
  } catch (error) {
    console.error('Error fetching interviews:', error);
    res.status(500).json({ error: 'Failed to fetch interviews' });
  }
});

// GET /api/interviews/candidate/:candidateId - Get interviews for a candidate
router.get('/candidate/:candidateId', async (req, res) => {
  try {
    const { candidateId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(candidateId)) {
      return res.status(400).json({ error: 'Invalid Candidate ID format' });
    }

    const interviews = await Interview.find({ candidate: candidateId })
      .populate('job')
      .populate('application')
      .sort({ createdAt: -1 });

    res.json(interviews);
  } catch (error) {
    console.error('Error fetching candidate interviews:', error);
    res.status(500).json({ error: 'Failed to fetch interviews' });
  }
});

// POST /api/interviews/start - Start an interview for a candidate
router.post('/start', async (req, res) => {
  try {
    const { applicationId } = req.body;
    
    if (!applicationId) {
      return res.status(400).json({ error: 'Application ID is required' });
    }

    // Get application and related data
    const application = await Application.findById(applicationId)
      .populate('job')
      .populate('candidate');

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (!application.shortlisted) {
      return res.status(400).json({ error: 'Candidate must be shortlisted to start interview' });
    }

    // Check if interview already exists
    let interview = await Interview.findOne({ application: applicationId });
    
    if (!interview) {
      // Generate questions for this specific job
      const questions = await generateQuestions(application.job);
      
      // Use the job's interviewDeadline if set, otherwise default to 7 days from now
      let interviewDeadline;
      if (application.job.interviewDeadline) {
        interviewDeadline = new Date(application.job.interviewDeadline);
      } else {
        interviewDeadline = new Date();
        interviewDeadline.setDate(interviewDeadline.getDate() + 7);
      }
      
      // Create new interview
      interview = new Interview({
        job: application.job._id,
        candidate: application.candidate._id,
        application: applicationId,
        questions: questions,
        status: 'Pending',
        deadline: interviewDeadline
      });
      
      await interview.save();
    }

    res.json({ 
      message: 'Interview started',
      interview: interview
    });
  } catch (error) {
    console.error('Error starting interview:', error);
    res.status(500).json({ error: 'Failed to start interview' });
  }
});

// Helper function to analyze video with hr_analyzer.py
const analyzeVideo = (videoUrl) => {
  return new Promise((resolve, reject) => {
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync('uploads')) {
      fs.mkdirSync('uploads');
    }

    const hrAnalyzer = spawn('python3', ['hr_analyzer.py', videoUrl]);
    
    let stdoutData = '';
    let stderrData = '';

    hrAnalyzer.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });

    hrAnalyzer.stderr.on('data', (data) => {
      stderrData += data.toString();
      console.log('HR Analyzer stderr:', data.toString());
    });

    hrAnalyzer.on('close', (code) => {
      if (code !== 0) {
        console.error(`HR Analyzer process exited with code ${code}`);
        console.error('stderr:', stderrData);
        reject(new Error(`HR Analyzer failed with code ${code}`));
        return;
      }

      try {
        const result = JSON.parse(stdoutData);
        resolve(result);
      } catch (error) {
        console.error('Failed to parse HR Analyzer output:', error);
        reject(error);
      }
    });
  });
};

// POST /api/interviews/submit-answer - Submit answer for a question
router.post('/submit-answer', upload.single('video'), async (req, res) => {
  try {
    const { interviewId, question, userAnswer, duration } = req.body;
    
    if (!interviewId || !question) {
      return res.status(400).json({ error: 'Interview ID and question are required' });
    }

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    // Find the correct answer for this question
    const questionData = interview.questions.find(q => q.question === question);
    if (!questionData) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Process video if provided
    let videoUrl = null;
    let hrAnalysis = null;
    let transcribedAnswer = userAnswer || '';
    
    if (req.file) {
      try {
        // Upload video to Cloudinary
        const cloudinaryResult = await uploadToCloudinary(req.file.path);
        videoUrl = cloudinaryResult.secure_url;
        
        // Analyze video with hr_analyzer.py
        hrAnalysis = await analyzeVideo(videoUrl);
        
        // If no userAnswer was provided but we have a video, use the transcription from hr_analyzer
        if (!userAnswer && hrAnalysis.transcription) {
          transcribedAnswer = hrAnalysis.transcription;
        }
        
        // Clean up the temporary file
        fs.unlinkSync(req.file.path);
      } catch (error) {
        console.error('Error processing video:', error);
        // Continue with text-only analysis if video processing fails
      }
    }

    // Generate AI feedback for content analysis
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    const prompt = `
      Question: "${question}"
      User Answer: "${transcribedAnswer}"
      Correct Answer: "${questionData.answer}"
      
      IMPORTANT: The rating must be precise with two decimal places (e.g., 7.42, 8.95, etc.), not just whole numbers or .5 increments.
      
      Please compare the user's answer to the correct answer, and provide a rating (from 1 to 10) based on answer quality, and offer feedback for improvement.
      Format your feedback with clear subheadings (like "Content", "Completeness", etc.) and use bullet points under each heading.
      Address the person directly using "your" instead of "the user".
      
      Return the result in JSON format with the fields "ratings" (number with two decimal places) and "feedback" (string).
      
      Example format:
      {
        "ratings": 7.85,
        "feedback": "## Content\\n* Your explanation of X concept is incomplete\\n* Your example demonstrates good understanding of Y\\n\\n## Completeness\\n* Your definition of Z contains an error\\n* Your approach to problem A is correct"
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    // Use object cleaner for feedback
    const aiResult = cleanJsonObjectResponse(response.text());

    // Calculate weighted score if we have both content and delivery analysis
    let contentRating = aiResult.ratings;
    let deliveryMetrics = {
      confidence: 0,
      speechRate: 0,
      eyeContact: 0
    };
    let deliveryFeedback = [];
    let finalRating = contentRating;
    
    if (hrAnalysis) {
      // Extract delivery metrics
      deliveryMetrics = {
        confidence: hrAnalysis.detailed_metrics?.confidence || 0,
        speechRate: hrAnalysis.detailed_metrics?.speech_rate || 0,
        eyeContact: hrAnalysis.detailed_metrics?.eye_contact || 0
      };
      
      // Extract delivery feedback (filtering out unwanted comments)
      deliveryFeedback = hrAnalysis.feedback_comments?.filter(comment => 
        !comment.toLowerCase().includes('filler word') && 
        !comment.toLowerCase().includes('long pause') &&
        !comment.toLowerCase().includes('speech clarity')
      ) || [];
      
      // Calculate weighted score (60% content, 20% confidence, 20% speech rate)
      const normalizedContentScore = (contentRating / 10) * 100; // Convert 0-10 to 0-100
      const confidenceScore = deliveryMetrics.confidence * 0.2; // 20% of confidence score
      const speechRateScore = deliveryMetrics.speechRate * 0.2; // 20% of speech rate score
      const weightedScore = normalizedContentScore * 0.6 + confidenceScore + speechRateScore;
      
      // Ensure the final score is within 1-10 range
      finalRating = Math.min(10, Math.max(1, weightedScore / 10));
    }

    // Save the response with all the data
    const interviewResponse = new InterviewResponse({
      interview: interviewId,
      question: question,
      correctAnswer: questionData.answer,
      userAnswer: transcribedAnswer,
      videoUrl: videoUrl,
      contentFeedback: aiResult.feedback,
      deliveryFeedback: deliveryFeedback,
      contentRating: contentRating,
      deliveryMetrics: deliveryMetrics,
      rating: finalRating,
      duration: duration || '40 seconds'
    });

    await interviewResponse.save();

    // Prepare the response data
    const responseData = {
      message: 'Answer submitted successfully',
      contentAnalysis: {
        rating: contentRating,
        feedback: aiResult.feedback
      }
    };
    
    // Add delivery analysis if available
    if (hrAnalysis) {
      responseData.deliveryAnalysis = {
        metrics: deliveryMetrics,
        feedback: deliveryFeedback
      };
      responseData.weightedRating = finalRating;
    }

    res.json(responseData);
  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({ error: 'Failed to submit answer' });
  }
});

// POST /api/interviews/complete - Complete an interview
router.post('/complete', async (req, res) => {
  try {
    const { interviewId } = req.body;
    
    if (!interviewId) {
      return res.status(400).json({ error: 'Interview ID is required' });
    }

    // Get all responses for this interview
    const responses = await InterviewResponse.find({ interview: interviewId });
    
    if (responses.length === 0) {
      return res.status(400).json({ error: 'No responses found for this interview' });
    }

    // Calculate scores
    let totalContentScore = 0;
    let totalConfidenceScore = 0;
    let totalSpeechRateScore = 0;
    let hasDeliveryMetrics = false;
    
    // Calculate average scores for each metric
    responses.forEach(response => {
      // Content score
      totalContentScore += response.contentRating || response.rating;
      
      // Delivery metrics if available
      if (response.deliveryMetrics) {
        totalConfidenceScore += response.deliveryMetrics.confidence || 0;
        totalSpeechRateScore += response.deliveryMetrics.speechRate || 0;
        hasDeliveryMetrics = true;
      }
    });
    
    const avgContentScore = totalContentScore / responses.length;
    
    // Calculate weighted score
    let overallRating, contentScore, deliveryScore, weightedScore;
    
    if (hasDeliveryMetrics) {
      // If we have delivery metrics, calculate weighted score
      const avgConfidenceScore = totalConfidenceScore / responses.length;
      const avgSpeechRateScore = totalSpeechRateScore / responses.length;
      
      // Scale content score to 0-100
      contentScore = (avgContentScore / 10) * 100;
      
      // Calculate delivery score components
      const confidenceComponent = avgConfidenceScore * 0.2; // 20% of confidence score
      const speechRateComponent = avgSpeechRateScore * 0.2; // 20% of speech rate score
      
      // Calculate delivery score (0-40 scale)
      deliveryScore = confidenceComponent + speechRateComponent;
      
      // Calculate weighted score (0-100 scale)
      weightedScore = contentScore * 0.6 + deliveryScore;
      
      // Convert back to 0-10 scale for compatibility
      overallRating = weightedScore / 10;
    } else {
      // If no delivery metrics, use content score only
      overallRating = avgContentScore;
      contentScore = avgContentScore * 10; // Scale to 0-100
      deliveryScore = 0;
      weightedScore = contentScore;
    }

    // Generate overall feedback
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    const responsesText = responses.map(r => 
      `Question: ${r.question}\nUser Answer: ${r.userAnswer}\nRating: ${r.rating}/10\nFeedback: ${r.contentFeedback || r.feedback}`
    ).join('\n\n');

    const prompt = `
      Based on the following interview responses, provide a comprehensive overall feedback for the candidate:
      
      ${responsesText}
      
      Overall Rating: ${overallRating.toFixed(2)}/10
      
      Please provide constructive feedback highlighting strengths and areas for improvement.
      Format your feedback with clear subheadings and bullet points.
      Address the person directly using "your" instead of "the user".
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const overallFeedback = response.text();

    // Update interview with all scores
    const interview = await Interview.findByIdAndUpdate(
      interviewId,
      {
        status: 'Completed',
        overallRating: Math.round(overallRating * 100) / 100,
        contentScore: Math.round(contentScore * 100) / 100,
        deliveryScore: Math.round(deliveryScore * 100) / 100,
        weightedScore: Math.round(weightedScore * 100) / 100,
        feedback: overallFeedback,
        completedAt: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    );

    // Update the candidate's application: set interviewStatus to 'Reviewing' and store score
    if (interview && interview.application) {
      await Application.findByIdAndUpdate(
        interview.application,
        {
          status: 'Reviewing',
          interviewScore: Math.round(weightedScore) // Store the 0-100 score
        }
      );
    }

    res.json({ 
      message: 'Interview completed',
      interview: interview,
      scores: {
        content: Math.round(contentScore * 100) / 100,
        delivery: Math.round(deliveryScore * 100) / 100,
        weighted: Math.round(weightedScore * 100) / 100,
        overall: Math.round(overallRating * 100) / 100
      },
      feedback: overallFeedback
    });
  } catch (error) {
    console.error('Error completing interview:', error);
    res.status(500).json({ error: 'Failed to complete interview' });
  }
});

// GET /api/interviews/:interviewId - Get specific interview with responses
router.get('/:interviewId', async (req, res) => {
  try {
    const { interviewId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(interviewId)) {
      return res.status(400).json({ error: 'Invalid Interview ID format' });
    }

    const interview = await Interview.findById(interviewId)
      .populate('job')
      .populate('candidate')
      .populate('application');

    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    const responses = await InterviewResponse.find({ interview: interviewId });

    res.json({ 
      interview: interview,
      responses: responses
    });
  } catch (error) {
    console.error('Error fetching interview:', error);
    res.status(500).json({ error: 'Failed to fetch interview' });
  }
});

export default router; 