import mongoose from 'mongoose';

const interviewResponseSchema = new mongoose.Schema({
  interview: { type: mongoose.Schema.Types.ObjectId, ref: 'Interview', required: true },
  question: { type: String, required: true },
  correctAnswer: { type: String, required: true },
  userAnswer: { type: String, required: true },
  feedback: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 10 },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('InterviewResponse', interviewResponseSchema); 