import mongoose from 'mongoose';

const selectedCandidateSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
  application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
  selectedAt: { type: Date, default: Date.now }
}, { collection: 'selected_candidates' });

export default mongoose.model('SelectedCandidate', selectedCandidateSchema); 