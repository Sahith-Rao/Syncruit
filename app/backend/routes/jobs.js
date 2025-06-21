import express from 'express';
import Job from '../models/Job.js';
import mongoose from 'mongoose';

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
      skillsRequired,
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
      skillsRequired,
      postedBy
    });
    await job.save();
    res.status(201).json({ message: 'Job posted successfully', job });
  } catch (error) {
    res.status(500).json({ error: 'Failed to post job' });
  }
});

// GET /api/jobs - Get all jobs, or jobs for a specific admin with application counts
router.get('/', async (req, res) => {
  try {
    const { adminId } = req.query;
    const matchStage = {};

    if (adminId) {
      if (!mongoose.Types.ObjectId.isValid(adminId)) {
        return res.status(400).json({ error: 'Invalid Admin ID format.' });
      }
      matchStage.postedBy = new mongoose.Types.ObjectId(adminId);
    }

    const jobs = await Job.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'applications', // the name of the applications collection
          localField: '_id',
          foreignField: 'job',
          as: 'applications'
        }
      },
      {
        $addFields: {
          applicationCount: { $size: '$applications' }
        }
      },
      {
        $project: {
          applications: 0 // Exclude the applications array from the final output
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    res.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

export default router; 