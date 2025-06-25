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
      deadline,
      skillsRequired,
      postedBy
    } = req.body;

    if (!title || !company || !location || !salary || !deadline || !postedBy) {
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
      deadline: new Date(deadline),
      skillsRequired,
      postedBy
    });
    await job.save();
    res.status(201).json({ message: 'Job posted successfully', job });
  } catch (error) {
    res.status(500).json({ error: 'Failed to post job' });
  }
});

// GET /api/jobs - Get all jobs, or jobs for a specific admin with application counts and application details for funnel
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
          from: 'applications',
          localField: '_id',
          foreignField: 'job',
          as: 'applications',
          pipeline: [
            { $project: { status: 1, interviewScore: 1 } }
          ]
        }
      },
      {
        $addFields: {
          applicationCount: { $size: '$applications' }
        }
      },
      {
        $project: {
          applications: 1,
          applicationCount: 1,
          title: 1,
          company: 1,
          location: 1,
          salary: 1,
          jobType: 1,
          experience: 1,
          description: 1,
          deadline: 1,
          skillsRequired: 1,
          techStack: 1,
          postedBy: 1,
          createdAt: 1,
          status: 1,
          interviewStatus: 1,
          interviewDeadline: 1
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

// GET /api/jobs/candidate - Get active jobs for candidates (filtered by deadline)
router.get('/candidate', async (req, res) => {
  try {
    const now = new Date();
    
    const jobs = await Job.find({
      deadline: { $gt: now },
      status: 'Applications Open'
    }).sort({ createdAt: -1 });

    res.json(jobs);
  } catch (error) {
    console.error('Error fetching candidate jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

export default router; 