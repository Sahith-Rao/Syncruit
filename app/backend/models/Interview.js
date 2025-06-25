import mongoose from 'mongoose';

const interviewSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
  application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
  questions: [{
    question: { type: String, required: true },
    answer: { type: String, required: true }
  }],
  status: { type: String, default: 'Pending', enum: ['Pending', 'In Progress', 'Completed'] },
  overallRating: { type: Number, default: 0 },
  feedback: { type: String },
  deadline: { type: Date, required: true },
  startedAt: { type: Date },
  completedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Interview', interviewSchema); 