const mongoose = require('mongoose');

const stakeSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  stakeAmount: {
    type: Number,
    required: true,
    min: 0
  },
  targetThreshold: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  actualScore: {
    type: Number,
    default: null,
    min: 0,
    max: 100
  },
  isWinner: {
    type: Boolean,
    default: null
  },
  rewardAmount: {
    type: Number,
    default: 0
  },
  isClaimed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Stake', stakeSchema);