import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String, required: true },
  salary: { type: String, required: true },
  jobType: { type: String },
  experience: { type: String },
  description: { type: String },
  requirements: { type: String },
  benefits: { type: String },
  lastDate: { type: String },
  skillsRequired: [{ type: String }],
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  createdAt: { type: Date, default: Date.now },
  status: { type: String, default: 'Active' }
});

export default mongoose.model('Job', jobSchema); 