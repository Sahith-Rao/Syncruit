import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { spawn } from 'child_process';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Initialize Google AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper function to upload file to Cloudinary
function uploadToCloudinary(fileBuffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: 'video' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
}

// Helper function to clean AI response for JSON array
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
  try {
    // First, try to parse the response directly (in case it's already valid JSON)
    try {
      return JSON.parse(responseText);
    } catch (directParseError) {
      // If direct parsing fails, proceed with cleaning
      console.log('Direct JSON parsing failed, attempting to clean response');
    }

    // Remove code block markers and other non-JSON text
    let cleanText = responseText.trim();
    cleanText = cleanText.replace(/(```json|```|`)/gi, "");
    
    // Try to extract JSON object using a more reliable approach
    const jsonMatch = cleanText.match(/\{(?:[^{}]|(\{(?:[^{}]|(\{(?:[^{}]|(\{[^{}]*\}))*\}))*\}))*\}/s);
    if (jsonMatch) {
      cleanText = jsonMatch[0];
    }
    
    // Handle escaped characters and newlines in a more robust way
    // First, temporarily replace escaped quotes to prevent confusion
    cleanText = cleanText.replace(/\\"/g, "___ESCAPED_QUOTE___");
    
    // Replace all newlines within string values with spaces
    let inString = false;
    let result = '';
    for (let i = 0; i < cleanText.length; i++) {
      const char = cleanText[i];
      
      if (char === '"' && (i === 0 || cleanText[i-1] !== '\\')) {
        inString = !inString;
      }
      
      if (inString && (char === '\n' || char === '\r')) {
        result += ' ';
      } else {
        result += char;
      }
    }
    
    // Restore escaped quotes
    result = result.replace(/___ESCAPED_QUOTE___/g, '\\"');
    
    // Additional cleanup for common issues
    // Remove any trailing commas before closing brackets or braces
    result = result.replace(/,\s*([\]}])/g, '$1');
    
    console.log('Cleaned JSON:', result);
    
    try {
      return JSON.parse(result);
    } catch (error) {
      console.error('Failed to parse cleaned JSON. Attempting fallback method.');
      
      // Fallback: Try to extract just the ratings and feedback fields
      const ratingsMatch = responseText.match(/"ratings"\s*:\s*(\d+)/);
      const feedbackMatch = responseText.match(/"feedback"\s*:\s*"([^"]*)"/);
      
      if (ratingsMatch && feedbackMatch) {
        console.log('Using fallback extraction method');
        return {
          ratings: parseInt(ratingsMatch[1]),
          feedback: feedbackMatch[1]
        };
      }
      
      // If all else fails, create a default response
      console.error('All parsing methods failed. Using default response.');
      return {
        ratings: 5,
        feedback: "Unable to parse AI response. The system encountered an error while processing your answer."
      };
    }
  } catch (error) {
    console.error('Fatal error in cleanJsonObjectResponse:', error);
    return {
      ratings: 5,
      feedback: "An error occurred while processing the AI response."
    };
  }
};

// Generate AI questions for mock interview
const generateMockQuestions = async (mockJobData) => {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  
  const prompt = `
    As an experienced prompt engineer, generate a JSON array containing 1 technical interview question along with a detailed answer based on the following job information. The object in the array should have the fields "question" and "answer", formatted as follows:

    [
      { "question": "<Question text>", "answer": "<Answer text>" }
    ]

    Job Information:
    - Job Position: ${mockJobData.title || 'Software Developer'}
    - Tech Stacks/Skills: ${mockJobData.techStack || 'General development'}
    - Experience Level: ${mockJobData.experience || 'Mid-level'}

    The question should assess:
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

// Evaluate answer using Gemini AI
const evaluateAnswer = async (question, userAnswer, correctAnswer) => {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  
  const prompt = `
    Question: "${question}"
    User Answer: "${userAnswer}"
    Correct Answer: "${correctAnswer}"
    
    Please compare the answer to the correct answer, and provide a rating (from 1 to 10) based on answer quality, and offer feedback for improvement.
    
    IMPORTANT: The rating must be precise with two decimal places (e.g., 7.42, 8.95, etc.), not just whole numbers or .5 increments.
    
    Format your feedback with the following requirements:
    1. Use clear subheadings (like "Content", "Completeness", etc.) but DO NOT include an "Accuracy" subheading
    2. Under each subheading, use short bullet points
    3. Address the person directly using "your" instead of "the user" (e.g., "Your answer lacks detail" instead of "The user's answer lacks detail")
    4. Keep each bullet point concise and actionable
    
    Return the result in JSON format with the fields "ratings" (number with two decimal places) and "feedback" (string).
    
    Example feedback format:
    "feedback": "## Content\\n* Your explanation of X concept is incomplete\\n* Your example demonstrates good understanding of Y\\n\\n## Completeness\\n* Your answer covers most key points but misses Z\\n* Your examples are relevant but could be more detailed"
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return cleanJsonObjectResponse(response.text());
};

// POST /api/mock-interviews/generate-questions
router.post('/generate-questions', async (req, res) => {
  try {
    const { title, techStack, experience } = req.body;
    
    if (!techStack || !techStack.trim()) {
      return res.status(400).json({ error: 'Tech stack is required' });
    }

    // Generate questions using AI
    const questions = await generateMockQuestions({
      title: title || 'Software Developer',
      techStack: techStack.trim(),
      experience: experience || 'Mid-level'
    });

    res.json({ 
      message: 'Questions generated successfully',
      questions: questions
    });
  } catch (error) {
    console.error('Error generating questions:', error);
    res.status(500).json({ error: 'Failed to generate questions' });
  }
});

// POST /api/mock-interviews/analyze
router.post('/analyze', upload.single('video'), async (req, res) => {
  try {
    const { questions, answers } = req.body;
    
    if (!req.file) {
      console.error('No video file uploaded');
      return res.status(400).json({ error: 'No video file uploaded' });
    }
    
    if (!questions || !answers) {
      return res.status(400).json({ error: 'Questions and answers are required' });
    }

    let parsedQuestions, parsedAnswers;
    try {
      parsedQuestions = JSON.parse(questions);
      parsedAnswers = JSON.parse(answers);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid JSON format for questions or answers' });
    }

    console.log('Received file:', req.file.originalname);

    // Upload video to Cloudinary
    let cloudinaryResult;
    try {
      cloudinaryResult = await uploadToCloudinary(req.file.buffer);
      console.log('Cloudinary upload result:', cloudinaryResult.secure_url);
    } catch (cloudErr) {
      console.error('Cloudinary upload failed:', cloudErr);
      return res.status(500).json({ error: 'Cloudinary upload failed', details: cloudErr });
    }

    // Process with hr_analyzer.py
    const scriptPath = path.resolve(process.cwd(), 'hr_analyzer.py');
    console.log('Calling hr_analyzer.py with:', scriptPath, cloudinaryResult.secure_url);
    
    const hrAnalysis = await new Promise((resolve, reject) => {
      const py = spawn('python3', [scriptPath, cloudinaryResult.secure_url]);
      let output = '';
      let errorOutput = '';
      
      py.stdout.on('data', (data) => { 
        output += data.toString(); 
        console.log('[PYTHON STDOUT]', data.toString());
      });
      
      py.stderr.on('data', (data) => { 
        errorOutput += data.toString(); 
        console.error('[PYTHON STDERR]', data.toString());
      });
      
      py.on('close', (code) => {
        console.log('Python script exited with code:', code);
        if (code !== 0) {
          console.error('hr_analyzer.py failed:', errorOutput);
          reject(new Error('hr_analyzer.py failed: ' + errorOutput));
          return;
        }
        
        try {
          const analysis = JSON.parse(output);
          resolve(analysis);
        } catch (err) {
          console.error('Failed to parse analysis result:', output);
          reject(new Error('Failed to parse analysis result'));
        }
      });
    });

    // Process with Gemini AI
    const geminiResults = [];
    for (let i = 0; i < parsedQuestions.length; i++) {
      if (i < parsedAnswers.length) {
        try {
          const result = await evaluateAnswer(
            parsedQuestions[i].question,
            parsedAnswers[i],
            parsedQuestions[i].answer
          );
          geminiResults.push(result);
        } catch (err) {
          console.error('Error evaluating answer:', err);
          geminiResults.push({ ratings: 0, feedback: 'Failed to evaluate answer' });
        }
      }
    }

    // Calculate overall Gemini score
    const totalGeminiScore = geminiResults.reduce((sum, result) => sum + (result.ratings || 0), 0);
    const averageGeminiScore = geminiResults.length > 0 ? totalGeminiScore / geminiResults.length : 0;

    // Extract confidence and speech rate from HR analysis
    const confidence = hrAnalysis.detailed_metrics?.confidence || 0;
    const speechRate = hrAnalysis.detailed_metrics?.speech_rate || 0;

    // Calculate weighted overall score on a scale of 0-100
    // Content analysis (Gemini): 60% weightage
    // Confidence from delivery analysis (HR): 20% weightage
    // Speech rate from delivery analysis (HR): 20% weightage
    
    // Normalize all scores to 0-100 scale first
    const normalizedGeminiScore = (averageGeminiScore / 10) * 100; // Convert 0-10 to 0-100
    
    // Apply weightage
    const contentScore = normalizedGeminiScore * 0.6; // 60% of content score
    const confidenceScore = confidence * 0.2; // 20% of confidence score
    const speechRateScore = speechRate * 0.2; // 20% of speech rate score
    
    // Combine scores and ensure it's within 0-100 range
    const weightedOverallScore = Math.min(100, Math.max(0, contentScore + confidenceScore + speechRateScore));

    // Combine results
    const combinedResults = {
      hrAnalysis: hrAnalysis,
      geminiAnalysis: {
        overall_score: Math.round(averageGeminiScore * 100) / 100,
        detailed_results: geminiResults
      },
      weightedScore: Math.round(weightedOverallScore * 100) / 100
    };

    res.json(combinedResults);
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

export default router;