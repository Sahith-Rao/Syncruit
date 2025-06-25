import express from 'express';
import Application from '../models/Application.js';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import Job from '../models/Job.js';
import SelectedCandidate from '../models/SelectedCandidate.js';

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
      .sort({ resumeScore: -1 })
      .lean();

    if (!applications) {
      return res.status(404).json({ message: 'No applications found for this job.' });
    }

    // Add interviewStatus and interviewScore to each application
    const appsWithInterview = applications.map(app => ({
      ...app,
      interviewStatus: app.interviewStatus || 'Not Started',
      interviewScore: app.interviewScore || null
    }));

    res.json(appsWithInterview);
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

// POST /api/applications/shortlist - Shortlist applicants and send emails
router.post('/shortlist', async (req, res) => {
  try {
    const { applicationIds, jobId, emailSubject, emailBody } = req.body;
    if (!jobId) {
      return res.status(400).json({ error: 'jobId is required.' });
    }

    if (!Array.isArray(applicationIds)) {
      return res.status(400).json({ error: 'applicationIds must be an array.' });
    }

    if (applicationIds.length === 0) {
      // Shortlist no one: mark all as Not Qualified
      await Application.updateMany(
        { job: jobId },
        { $set: { shortlisted: false, status: 'Not Qualified' } }
      );
      // Update job status
      await Job.findByIdAndUpdate(jobId, { $set: { status: 'Selection Complete' } }, { new: true });
      return res.json({ message: 'No candidates shortlisted. Selection complete.' });
    }

    // Update applications as shortlisted
    await Application.updateMany(
      { _id: { $in: applicationIds }, job: jobId },
      { $set: { shortlisted: true, status: 'Shortlisted' } }
    );

    // Update non-shortlisted applications to 'Not Qualified'
    await Application.updateMany(
      { job: jobId, _id: { $nin: applicationIds } },
      { $set: { status: 'Not Qualified' } }
    );

    // Update the job status to 'Shortlisted, Interview Pending'
    const updatedJob = await Job.findByIdAndUpdate(jobId, { $set: { status: 'Shortlisted, Interview Pending' } }, { new: true });
    console.log('Updated job after shortlisting:', updatedJob);

    // Fetch candidate emails
    const shortlistedApps = await Application.find({ _id: { $in: applicationIds } }).populate('candidate');
    const emails = shortlistedApps.map(app => app.candidate.email);

    // Send emails (using nodemailer, configure with your SMTP or a test account)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: emails,
      subject: emailSubject || 'You have been shortlisted!',
      text: emailBody || 'Congratulations! You have been shortlisted for the next round. We will contact you soon.'
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: 'Shortlisted and emails sent', updatedCount: applicationIds.length });
  } catch (error) {
    console.error('Error shortlisting applicants:', error);
    res.status(500).json({ error: 'Failed to shortlist applicants and send emails.' });
  }
});

// POST /api/applications/select-top
router.post('/select-top', async (req, res) => {
  try {
    const { jobId, applicationIds, emailSubject, emailBody } = req.body;
    if (!jobId || !Array.isArray(applicationIds)) {
      return res.status(400).json({ error: 'jobId and applicationIds (array) are required.' });
    }

    if (applicationIds.length === 0) {
      // Select no one: mark all as Not Selected
      await Application.updateMany(
        { job: jobId },
        { $set: { status: 'Not Selected' } }
      );
      // Update job status
      await Job.findByIdAndUpdate(jobId, { $set: { status: 'Selection Complete' } });
      return res.json({ message: 'No candidates selected. All marked as Not Selected.' });
    }

    // Update selected applications
    await Application.updateMany(
      { _id: { $in: applicationIds }, job: jobId },
      { $set: { status: 'Selected', interviewStatus: 'Selected' } }
    );

    // Update non-selected applications to 'Not Selected'
    await Application.updateMany(
      { job: jobId, _id: { $nin: applicationIds } },
      { $set: { status: 'Not Selected' } }
    );

    // Fetch candidate emails
    const selectedApps = await Application.find({ _id: { $in: applicationIds } }).populate('candidate');
    const emails = selectedApps.map(app => app.candidate.email);

    // Send emails (using nodemailer, configure with your SMTP or a test account)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: emails,
      subject: emailSubject || 'Congratulations! You have been selected',
      text: emailBody || 'You have been selected for the next stage. We will contact you soon.'
    };

    await transporter.sendMail(mailOptions);

    // After sending emails in /select-top, update the job status
    await Job.findByIdAndUpdate(jobId, { $set: { status: 'Selection Complete' } });

    // Store selected candidate details in the SelectedCandidate collection
    for (const app of selectedApps) {
      await SelectedCandidate.create({
        job: jobId,
        candidate: app.candidate._id,
        application: app._id
      });
    }

    res.json({ message: 'Candidates selected and emails sent.' });
  } catch (error) {
    console.error('Error selecting candidates:', error);
    res.status(500).json({ error: 'Failed to select candidates and send emails.' });
  }
});

// GET /api/applications/admin/:adminId/pending - Get count of pending applications for all jobs posted by this admin
router.get('/admin/:adminId/pending', async (req, res) => {
  try {
    const { adminId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(adminId)) {
      return res.status(400).json({ error: 'Invalid Admin ID format.' });
    }
    // Find all jobs posted by this admin
    const jobs = await Job.find({ postedBy: adminId }, { _id: 1 });
    const jobIds = jobs.map(job => job._id);
    // Count applications with status 'Applied' or 'Reviewing' for these jobs
    const pendingCount = await Application.countDocuments({
      job: { $in: jobIds },
      status: { $in: ['Applied', 'Reviewing'] }
    });
    res.json({ pending: pendingCount });
  } catch (error) {
    console.error('Error fetching pending applications:', error);
    res.status(500).json({ error: 'Failed to fetch pending applications count.' });
  }
});

export default router; 