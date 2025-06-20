import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { spawn } from 'child_process';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

// POST /api/analyze-interview
router.post('/', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      console.error('No video file uploaded');
      return res.status(400).json({ error: 'No video file uploaded' });
    }
    console.log('Received file:', req.file.originalname);

    // Await the upload
    let result;
    try {
      result = await uploadToCloudinary(req.file.buffer);
      console.log('Cloudinary upload result:', result.secure_url);
    } catch (cloudErr) {
      console.error('Cloudinary upload failed:', cloudErr);
      return res.status(500).json({ error: 'Cloudinary upload failed', details: cloudErr });
    }

    // Use absolute path to hr_analyzer.py
    const scriptPath = path.resolve(process.cwd(), 'hr_analyzer.py');
    console.log('Calling hr_analyzer.py with:', scriptPath, result.secure_url);
    const py = spawn('python3', [scriptPath, result.secure_url]);
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
      console.log('Full Python stdout:', output);
      console.log('Full Python stderr:', errorOutput);
      if (code !== 0) {
        console.error('hr_analyzer.py failed:', errorOutput);
        return res.status(500).json({ error: 'hr_analyzer.py failed', details: errorOutput });
      }
      try {
        const analysis = JSON.parse(output);
        res.json({ analysis });
      } catch (err) {
        console.error('Failed to parse analysis result:', output);
        // Return both stdout and stderr for debugging
        res.status(500).json({ error: 'Failed to parse analysis result', stdout: output, stderr: errorOutput });
      }
    });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

export default router; 