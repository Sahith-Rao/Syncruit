const express = require('express');
const router = express.Router();
const { authenticateToken, isAdmin } = require('../middleware/auth');
const Job = require('../models/Job');

// Create a new job (admin only)
router.post('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { title, company, description, requirements, questions } = req.body;

    const job = new Job({
      title,
      company,
      description,
      requirements,
      questions,
      createdBy: req.user.adminId
    });

    await job.save();
    res.status(201).json(job);
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ error: 'Error creating job' });
  }
});

// Get all jobs
router.get('/', authenticateToken, async (req, res) => {
  try {
    const jobs = await Job.find({ isActive: true })
      .select('-__v')
      .sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Error fetching jobs' });
  }
});

// Get a single job
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).select('-__v');
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ error: 'Error fetching job' });
  }
});

// Update a job (admin only)
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if the job was created by this admin
    if (job.createdBy.toString() !== req.user.adminId) {
      return res.status(403).json({ error: 'Not authorized to update this job' });
    }

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    ).select('-__v');

    res.json(updatedJob);
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({ error: 'Error updating job' });
  }
});

// Delete a job (admin only)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if the job was created by this admin
    if (job.createdBy.toString() !== req.user.adminId) {
      return res.status(403).json({ error: 'Not authorized to delete this job' });
    }

    await job.remove();
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ error: 'Error deleting job' });
  }
});

module.exports = router; 