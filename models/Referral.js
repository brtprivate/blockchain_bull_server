const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  referrerAddress: {
    type: String,
    required: true,
    lowercase: true
  },
  referredAddress: {
    type: String,
    required: true,
    lowercase: true
  },
  level: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  commissionEarned: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for faster queries
referralSchema.index({ referrerAddress: 1, level: 1 });
referralSchema.index({ referredAddress: 1 });
referralSchema.index({ registrationDate: -1 });

module.exports = mongoose.model('Referral', referralSchema);
