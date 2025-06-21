import express from 'express';
import Application from '../models/Application.js';
import mongoose from 'mongoose';

const router = express.Router();

// GET /api/applications/job/:jobId - Get all applications for a specific job
router.get('/job/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({ error: 'Invalid Job ID format.' });
    }

    const applications = await Application.find({ job: jobId })
      .populate('candidate') // This will replace the 'candidate' ObjectId with the full candidate document
      .sort({ resumeScore: -1 }); // Sort by score descending

    if (!applications) {
      return res.status(404).json({ message: 'No applications found for this job.' });
    }

    res.json(applications);
  } catch (error) {
    console.error('Error fetching job applications:', error);
    res.status(500).json({ error: 'Server error while fetching job applications.' });
  }
});

// GET /api/applications/candidate/:candidateId - Get all applications for a candidate
router.get('/candidate/:candidateId', async (req, res) => {
  try {
    const { candidateId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(candidateId)) {
      return res.status(400).json({ error: 'Invalid Candidate ID format.' });
    }

    const applications = await Application.find({ candidate: candidateId })
      .populate('job') // This will replace the 'job' ObjectId with the full job document
      .sort({ appliedAt: -1 });

    if (!applications) {
      return res.status(404).json({ message: 'No applications found for this candidate.' });
    }
    
    res.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'Server error while fetching applications.' });
  }
});

export default router; 