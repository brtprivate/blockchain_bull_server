const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema({
  userAddress: {
    type: String,
    required: true,
    lowercase: true
  },
  investmentAmount: {
    type: Number,
    required: true,
    min: 0
  },
  investmentDate: {
    type: Date,
    default: Date.now
  },
  investmentType: {
    type: String,
    enum: ['package', 'stake', 'direct', 'other'],
    default: 'package'
  },
  packageIndex: {
    type: Number,
    default: null
  },
  transactionHash: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'failed'],
    default: 'confirmed'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  roiEarned: {
    type: Number,
    default: 0
  },
  totalWithdrawn: {
    type: Number,
    default: 0
  },
  remainingBalance: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for faster queries
investmentSchema.index({ userAddress: 1 });
investmentSchema.index({ investmentDate: -1 });
investmentSchema.index({ investmentType: 1 });
investmentSchema.index({ status: 1 });

module.exports = mongoose.model('Investment', investmentSchema);
