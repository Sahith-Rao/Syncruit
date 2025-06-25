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

// GET /api/jobs/check-deadlines - Manually trigger job deadline check (for testing)
router.get('/check-deadlines', async (req, res) => {
  try {
    const now = new Date();
    
    // Find all jobs that are past deadline and still open for applications
    const expiredJobs = await Job.find({
      deadline: { $lt: now },
      status: 'Applications Open'
    });

    console.log('Jobs found for closing:', expiredJobs.map(j => ({
      _id: j._id,
      title: j.title,
      deadline: j.deadline,
      status: j.status
    })));

    if (expiredJobs.length === 0) {
      return res.json({ message: 'No jobs past deadline found', closedCount: 0 });
    }

    // Update job status to 'Applications Closed'
    const updateResult = await Job.updateMany(
      { _id: { $in: expiredJobs.map(job => job._id) } },
      { $set: { status: 'Applications Closed' } }
    );

    res.json({ 
      message: 'Job applications closed',
      closedCount: updateResult.modifiedCount
    });
  } catch (error) {
    console.error('Error checking job deadlines:', error);
    res.status(500).json({ error: 'Failed to check job deadlines' });
  }
});

export default router; 