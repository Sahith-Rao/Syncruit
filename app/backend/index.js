import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import http from 'http';

import authRoutes from './routes/auth.js';
import jobsRoutes from './routes/jobs.js';
import analyzeRoutes from './routes/analyze.js';
import resumeRoutes from './routes/resume.js';
import applicationsRoutes from './routes/applications.js';
import interviewRoutes from './routes/interviews.js';
import Application from './models/Application.js';
import Interview from './models/Interview.js';
import Job from './models/Job.js';

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/analyze-interview', analyzeRoutes);
app.use('/api/analyze/resume', resumeRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/interviews', interviewRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch((err) => console.error('MongoDB connection error:', err));

// Set timeout to 10 minutes (600000 ms) for long-running requests
const server = http.createServer(app);
server.setTimeout(600000); // 10 minutes

// Scheduled task to check for expired interviews (runs every hour)
const checkExpiredInterviews = async () => {
  try {
    console.log('Checking for expired interviews...');
    const now = new Date();
    
    // Find all interviews that are past deadline and not completed
    const expiredInterviews = await Interview.find({
      deadline: { $lt: now },
      status: { $ne: 'Completed' }
    });

    console.log(`Found ${expiredInterviews.length} expired interviews`);

    if (expiredInterviews.length === 0) {
      console.log('No expired interviews found');
      return;
    }

    // Update application statuses for expired interviews
    const applicationIds = expiredInterviews.map(interview => interview.application);
    
    const updateResult = await Application.updateMany(
      { _id: { $in: applicationIds } },
      { $set: { status: 'Interview Expired' } }
    );

    // Update interview statuses
    await Interview.updateMany(
      { _id: { $in: expiredInterviews.map(i => i._id) } },
      { $set: { status: 'Expired' } }
    );

    // Update job status to 'Interviews Closed' for jobs with expired interviews
    const jobIds = [...new Set(expiredInterviews.map(interview => interview.job))];
    await Job.updateMany(
      { _id: { $in: jobIds }, status: 'Interviews Open' },
      { $set: { status: 'Interviews Closed' } }
    );

    console.log(`Processed ${expiredInterviews.length} expired interviews. Updated ${updateResult.modifiedCount} applications.`);
  } catch (error) {
    console.error('Error checking expired interviews:', error);
  }
};

// Scheduled task to close job applications after deadline (runs every hour)
const checkJobDeadlines = async () => {
  try {
    console.log('Checking for job deadlines...');
    const now = new Date();
    
    // Find all jobs that are past deadline and still open for applications
    const expiredJobs = await Job.find({
      deadline: { $lt: now },
      status: 'Applications Open'
    });

    console.log(`Found ${expiredJobs.length} jobs past deadline`);

    if (expiredJobs.length === 0) {
      console.log('No jobs past deadline found');
      return;
    }

    // Update job status to 'Applications Closed'
    const updateResult = await Job.updateMany(
      { _id: { $in: expiredJobs.map(job => job._id) } },
      { $set: { status: 'Applications Closed' } }
    );

    console.log(`Closed ${updateResult.modifiedCount} job applications.`);
  } catch (error) {
    console.error('Error checking job deadlines:', error);
  }
};

// Run the checks every hour
setInterval(checkExpiredInterviews, 60 * 60 * 1000);
setInterval(checkJobDeadlines, 60 * 60 * 1000);

// Also run them once on startup
setTimeout(checkExpiredInterviews, 5000);
setTimeout(checkJobDeadlines, 5000);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 