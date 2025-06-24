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
    const { applicationIds, jobId } = req.body;
    if (!Array.isArray(applicationIds) || !jobId) {
      return res.status(400).json({ error: 'applicationIds (array) and jobId are required.' });
    }

    // Update applications as shortlisted
    const updated = await Application.updateMany(
      { _id: { $in: applicationIds }, job: jobId },
      { $set: { shortlisted: true, status: 'Shortlisted' } }
    );

    // Update the job status to 'Interview Pending'
    const updatedJob = await Job.findByIdAndUpdate(jobId, { $set: { status: 'Interview Pending' } }, { new: true });
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
      subject: 'You have been shortlisted!',
      text: 'Congratulations! You have been shortlisted for the next round. We will contact you soon.'
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: 'Shortlisted and emails sent', updatedCount: updated.nModified || updated.modifiedCount });
  } catch (error) {
    console.error('Error shortlisting applicants:', error);
    res.status(500).json({ error: 'Failed to shortlist applicants and send emails.' });
  }
});

// POST /api/applications/select-top
router.post('/select-top', async (req, res) => {
  try {
    const { jobId, applicationIds } = req.body;
    if (!jobId || !Array.isArray(applicationIds) || applicationIds.length === 0) {
      return res.status(400).json({ error: 'jobId and applicationIds (array) are required.' });
    }

    // Update selected applications
    await Application.updateMany(
      { _id: { $in: applicationIds }, job: jobId },
      { $set: { interviewStatus: 'Selected' } }
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
      subject: 'Congratulations! You have been selected',
      text: 'You have been selected for the next stage. We will contact you soon.'
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

export default router; 