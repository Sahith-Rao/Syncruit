import express from 'express';
import Application from '../models/Application.js';
import mongoose from 'mongoose';

const router = express.Router();

// GET /api/applications/:candidateId - Get all applications for a candidate
router.get('/:candidateId', async (req, res) => {
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