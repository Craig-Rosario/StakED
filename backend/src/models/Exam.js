const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  examDate: {
    type: Date,
    required: true
  },
  stakeDeadline: {
    type: Date,
    required: true
  },
  commitDeadline: {
    type: Date,
    required: true
  },
  revealDeadline: {
    type: Date,
    required: true
  },
  totalStakePool: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['upcoming', 'staking', 'completed', 'grading', 'revealed'],
    default: 'upcoming'
  },
  commitHash: {
    type: String,
    default: null
  },
  gradesRevealed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Exam', examSchema);