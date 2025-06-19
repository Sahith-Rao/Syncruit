import express from 'express';
import Job from '../models/Job.js';

const router = express.Router();

// POST /api/jobs - Create a new job posting
router.post('/', async (req, res) => {
  try {
    const {
      title,
      company,
      location,
      salary,
      jobType,
      experience,
      description,
      requirements,
      benefits,
      lastDate,
      postedBy
    } = req.body;

    if (!title || !company || !location || !salary || !postedBy) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const job = new Job({
      title,
      company,
      location,
      salary,
      jobType,
      experience,
      description,
      requirements,
      benefits,
      lastDate,
      postedBy
    });
    await job.save();
    res.status(201).json({ message: 'Job posted successfully', job });
  } catch (error) {
    res.status(500).json({ error: 'Failed to post job' });
  }
});

export default router; 