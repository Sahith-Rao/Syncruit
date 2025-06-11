const mongoose = require('mongoose');

const interviewResponseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  question: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  videoUrl: {
    type: String,
    required: true
  },
  analysis: {
    overall_score: Number,
    detailed_metrics: {
      type: Map,
      of: mongoose.Schema.Types.Mixed
    },
    feedback_comments: [String]
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

const InterviewResponse = mongoose.model('InterviewResponse', interviewResponseSchema);

module.exports = InterviewResponse; 