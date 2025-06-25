import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  resumeScore: { type: Number, required: true },
  resumeUrl: { type: String },
  appliedAt: { type: Date, default: Date.now },
  status: { 
    type: String, 
    default: 'Applied',
    enum: ['Applied', 'Shortlisted', 'Not Qualified', 'Reviewing', 'Interview Expired', 'Selected', 'Not Selected']
  },
  shortlisted: { type: Boolean, default: false },
  interviewStatus: { type: String, default: 'Not Started' }, // 'Not Started', 'Result Pending', 'Selected'
  interviewScore: { type: Number }, // Store interview score for admin selection
}, { collection: 'applications' });

export default mongoose.model('Application', applicationSchema); 