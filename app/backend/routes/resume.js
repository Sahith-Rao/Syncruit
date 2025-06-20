import express from 'express';
import multer from 'multer';
import { spawn } from 'child_process';
import fs from 'fs';
import mongoose from 'mongoose';
import path from 'path';
import Application from '../models/Application.js';

const router = express.Router();

const uploadsDir = 'uploads/';
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

router.post('/', upload.single('resume'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  const resumePath = req.file.path;
  const jobDescription = req.body.jobDescription;
  const candidateId = req.body.candidateId;
  const jobId = req.body.jobId;

  if (!candidateId || !jobId) {
    fs.unlink(resumePath, () => {});
    return res.status(400).json({ error: 'Missing candidateId or jobId' });
  }

  const pythonProcess = spawn('python', ['../../resume_analyzer.py', resumePath, jobDescription]);

  let score = '';
  pythonProcess.stdout.on('data', (data) => {
    score += data.toString();
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  pythonProcess.on('close', async (code) => {
    console.log(`child process exited with code ${code}`);
    fs.unlink(resumePath, (err) => {
        if (err) {
            console.error(err);
        }
    });
    const resumeScore = parseInt(score.trim(), 10);
    try {
      const application = await Application.create({
        candidate: candidateId,
        job: jobId,
        resumeScore,
        resumeUrl: resumePath,
        status: 'Applied'
      });
      res.json({ score: resumeScore, application });
    } catch (err) {
      res.status(500).json({ error: 'Failed to save application', details: err.message });
    }
  });
});

export default router; 