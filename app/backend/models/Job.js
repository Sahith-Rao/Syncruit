import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String, required: true },
  salary: { type: String, required: true },
  jobType: { type: String },
  experience: { type: String },
  description: { type: String },
  deadline: { type: Date, required: true },
  skillsRequired: [{ type: String }],
  techStack: { type: String },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  createdAt: { type: Date, default: Date.now },
  status: { 
    type: String, 
    default: 'Applications Open',
    enum: ['Applications Open', 'Applications Closed', 'Shortlisted, Interview Pending', 'Interviews Open', 'Interviews Closed', 'Selection Complete']
  },
  interviewStatus: { type: String, default: 'Not Started' },
  interviewDeadline: { type: Date }, 
});

export default mongoose.model('Job', jobSchema); 