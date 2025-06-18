import mongoose from 'mongoose';

const CandidateSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  name: { type: String, required: true }, // full name for backward compatibility
  email: { type: String, required: true, unique: true },
  mobile: { type: String },
  currentPosition: { type: String },
  experience: { type: String },
  skills: { type: String },
  password: { type: String, required: true },
  resumeUrl: { type: String },
}, { collection: 'candidates' });

const Candidate = mongoose.model('Candidate', CandidateSchema);

export default Candidate; 