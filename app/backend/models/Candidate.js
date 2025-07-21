import mongoose from 'mongoose';

const CandidateSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  name: { type: String, required: true }, 
  email: { type: String, required: true, unique: true },
  mobile: { type: String, required: true },
  location: { type: String, required: true },
  currentPosition: { type: String, required: true },
  experience: { type: String, required: true },
  skills: { type: String, required: true },
  summary: { type: String },
  education: { type: String },
  certifications: { type: String },
  password: { type: String, required: true },
  resumeUrl: { type: String },
}, { collection: 'candidates' });

const Candidate = mongoose.model('Candidate', CandidateSchema);

export default Candidate; 