import express from 'express';
import Interview from '../models/Interview.js';
import InterviewResponse from '../models/InterviewResponse.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import mongoose from 'mongoose';

const router = express.Router();

// Initialize Google AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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
  let cleanText = responseText.trim();
  cleanText = cleanText.replace(/(json|```|`)/gi, "");
  // Remove all control characters except for \n, \r, \t
  cleanText = cleanText.replace(/[\u0000-\u0019]+/g, "");
  // Replace unescaped newlines in string values with spaces
  cleanText = cleanText.replace(/:(\s*)"([^"]*?)\n([^"]*?)"/g, (match, p1, p2, p3) => `:${p1}"${p2} ${p3}"`);
  // Try to extract the first {...} block
  const match = cleanText.match(/{[\s\S]*}/);
  if (match) cleanText = match[0];
  try {
    return JSON.parse(cleanText);
  } catch (error) {
    console.error('Failed to parse cleaned Gemini JSON object:', cleanText);
    throw new Error("Invalid JSON format: " + error.message);
  }
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

// POST /api/interviews/submit-answer - Submit answer for a question
router.post('/submit-answer', async (req, res) => {
  try {
    const { interviewId, question, userAnswer } = req.body;
    
    if (!interviewId || !question || !userAnswer) {
      return res.status(400).json({ error: 'Interview ID, question, and user answer are required' });
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

    // Generate AI feedback
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    const prompt = `
      Question: "${question}"
      User Answer: "${userAnswer}"
      Correct Answer: "${questionData.answer}"
      Please compare the user's answer to the correct answer, and provide a rating (from 1 to 10) based on answer quality, and offer feedback for improvement.
      Return the result in JSON format with the fields "ratings" (number) and "feedback" (string).
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    // Use object cleaner for feedback
    const aiResult = cleanJsonObjectResponse(response.text());

    // Save the response
    const interviewResponse = new InterviewResponse({
      interview: interviewId,
      question: question,
      correctAnswer: questionData.answer,
      userAnswer: userAnswer,
      feedback: aiResult.feedback,
      rating: aiResult.ratings
    });

    await interviewResponse.save();

    res.json({ 
      message: 'Answer submitted successfully',
      feedback: aiResult
    });
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

    // Calculate overall rating
    const totalRating = responses.reduce((sum, response) => sum + response.rating, 0);
    const overallRating = totalRating / responses.length;

    // Generate overall feedback
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    const responsesText = responses.map(r => 
      `Question: ${r.question}\nUser Answer: ${r.userAnswer}\nRating: ${r.rating}/10\nFeedback: ${r.feedback}`
    ).join('\n\n');

    const prompt = `
      Based on the following interview responses, provide a comprehensive overall feedback for the candidate:
      
      ${responsesText}
      
      Overall Rating: ${overallRating.toFixed(1)}/10
      
      Please provide constructive feedback highlighting strengths and areas for improvement.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const overallFeedback = response.text();

    // Update interview
    const interview = await Interview.findByIdAndUpdate(
      interviewId,
      {
        status: 'Completed',
        overallRating: Math.round(overallRating * 10) / 10,
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
          interviewScore: Math.round(overallRating * 10) / 10
        }
      );
    }

    res.json({ 
      message: 'Interview completed',
      interview: interview,
      overallRating: overallRating,
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

// GET /api/interviews/check-expired - Manually trigger expired interview check (for testing)
router.get('/check-expired', async (req, res) => {
  try {
    const now = new Date();
    
    // Find all interviews that are past deadline and not completed
    const expiredInterviews = await Interview.find({
      deadline: { $lt: now },
      status: { $ne: 'Completed' }
    });

    // Update application statuses for expired interviews
    const applicationIds = expiredInterviews.map(interview => interview.application);
    const updateResult = await Application.updateMany(
      { _id: { $in: applicationIds } },
      { $set: { status: 'Interview Expired' } }
    );

    // Update interview statuses
    await Interview.updateMany(
      { _id: { $in: expiredInterviews.map(i => i._id) } },
      { $set: { status: 'Expired' } }
    );

    // --- NEW LOGIC: Expire applications for shortlisted candidates who never started interview ---
    // Find jobs with interviewDeadline in the past and status 'Interviews Open' or 'Shortlisted, Interview Pending'
    const expiredJobs = await Job.find({
      interviewDeadline: { $lt: now },
      status: { $in: ['Interviews Open', 'Shortlisted, Interview Pending'] }
    });
    let additionallyExpired = 0;
    for (const job of expiredJobs) {
      // Find shortlisted applications for this job that are not already expired/selected/not selected
      const apps = await Application.find({
        job: job._id,
        shortlisted: true,
        status: { $nin: ['Selected', 'Not Selected', 'Interview Expired'] }
      });
      for (const app of apps) {
        // Check if an interview exists for this application
        const interviewExists = await Interview.exists({ application: app._id });
        if (!interviewExists) {
          await Application.findByIdAndUpdate(app._id, { status: 'Interview Expired' });
          additionallyExpired++;
        }
      }
    }

    res.json({ 
      message: 'Expired interviews processed',
      expiredCount: expiredInterviews.length,
      additionallyExpired
    });
  } catch (error) {
    console.error('Error checking expired interviews:', error);
    res.status(500).json({ error: 'Failed to check expired interviews' });
  }
});

// POST /api/interviews/check-expired - Check and update expired interviews
router.post('/check-expired', async (req, res) => {
  try {
    const now = new Date();
    
    // Find all interviews that are past deadline and not completed
    const expiredInterviews = await Interview.find({
      deadline: { $lt: now },
      status: { $ne: 'Completed' }
    });

    if (expiredInterviews.length === 0) {
      return res.json({ message: 'No expired interviews found' });
    }

    // Update application statuses for expired interviews
    const applicationIds = expiredInterviews.map(interview => interview.application);
    
    await Application.updateMany(
      { _id: { $in: applicationIds } },
      { $set: { status: 'Interview Expired' } }
    );

    // Update interview statuses
    await Interview.updateMany(
      { _id: { $in: expiredInterviews.map(i => i._id) } },
      { $set: { status: 'Expired' } }
    );

    res.json({ 
      message: 'Expired interviews processed',
      expiredCount: expiredInterviews.length
    });
  } catch (error) {
    console.error('Error checking expired interviews:', error);
    res.status(500).json({ error: 'Failed to check expired interviews' });
  }
});

export default router; 