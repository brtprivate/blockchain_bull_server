const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  referrerAddress: {
    type: String,
    required: true,
    lowercase: true
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  totalReferrals: {
    type: Number,
    default: 0
  },
  level1Referrals: {
    type: Number,
    default: 0
  },
  level2Referrals: {
    type: Number,
    default: 0
  },
  level3Referrals: {
    type: Number,
    default: 0
  },
  level4Referrals: {
    type: Number,
    default: 0
  },
  level5Referrals: {
    type: Number,
    default: 0
  },
  level6Referrals: {
    type: Number,
    default: 0
  },
  level7Referrals: {
    type: Number,
    default: 0
  },
  level8Referrals: {
    type: Number,
    default: 0
  },
  level9Referrals: {
    type: Number,
    default: 0
  },
  level10Referrals: {
    type: Number,
    default: 0
  },
  totalInvestment: {
    type: Number,
    default: 0
  },
  totalEarnings: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for faster queries
userSchema.index({ address: 1 });
userSchema.index({ referrerAddress: 1 });
userSchema.index({ registrationDate: -1 });

module.exports = mongoose.model('User', userSchema);
