import mongoose from 'mongoose';

const interviewResponseSchema = new mongoose.Schema({
  interview: { type: mongoose.Schema.Types.ObjectId, ref: 'Interview', required: true },
  question: { type: String, required: true },
  correctAnswer: { type: String, required: true },
  userAnswer: { type: String, required: true },
  videoUrl: { type: String },
  contentFeedback: { type: String },
  deliveryFeedback: { type: [String], default: [] },
  contentRating: { type: Number, min: 1, max: 10 },
  deliveryMetrics: {
    confidence: { type: Number, default: 0 },
    speechRate: { type: Number, default: 0 },
    eyeContact: { type: Number, default: 0 }
  },
  rating: { type: Number, required: true, min: 1, max: 10 },
  duration: { type: String, default: '40 seconds' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('InterviewResponse', interviewResponseSchema);