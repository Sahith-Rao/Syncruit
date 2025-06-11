const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  requirements: [{
    type: String,
    required: true
  }],
  questions: [{
    text: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true,
      enum: ['technical', 'behavioral', 'general']
    },
    timeLimit: {
      type: Number,
      required: true,
      min: 30,
      max: 600
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Job = mongoose.model('Job', jobSchema);

module.exports = Job; 