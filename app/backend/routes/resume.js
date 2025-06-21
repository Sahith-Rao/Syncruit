import express from 'express';
import multer from 'multer';
import { spawn } from 'child_process';
import fs from 'fs';
import mongoose from 'mongoose';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import Application from '../models/Application.js';

dotenv.config();

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Function to upload file to Cloudinary
function uploadToCloudinary(fileBuffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { 
        resource_type: 'raw',
        folder: 'resumes',
        public_id: `${Date.now()}`
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
}

router.post('/', upload.single('resume'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  
  const jobDescription = req.body.jobDescription;
  const candidateId = req.body.candidateId;
  const jobId = req.body.jobId;

  if (!candidateId || !jobId) {
    return res.status(400).json({ error: 'Missing candidateId or jobId' });
  }

  try {
    // Upload file to Cloudinary
    const cloudinaryResult = await uploadToCloudinary(req.file.buffer);
    console.log('Cloudinary upload result:', cloudinaryResult.secure_url);
    console.log('File size:', req.file.size);
    console.log('File mimetype:', req.file.mimetype);

    // Call Python script with Cloudinary URL
    const pythonProcess = spawn('python', ['resume_analyzer.py', cloudinaryResult.secure_url, jobDescription]);

    let score = '';
    pythonProcess.stdout.on('data', (data) => {
      score += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });

    pythonProcess.on('close', async (code) => {
      console.log(`child process exited with code ${code}`);
      
      const resumeScore = parseInt(score.trim(), 10);
      try {
        const application = await Application.create({
          candidate: candidateId,
          job: jobId,
          resumeScore,
          resumeUrl: cloudinaryResult.secure_url,
          status: 'Applied'
        });
        res.json({ score: resumeScore, application });
      } catch (err) {
        res.status(500).json({ error: 'Failed to save application', details: err.message });
      }
    });

  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    res.status(500).json({ error: 'Failed to upload file', details: error.message });
  }
});

export default router; 