const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Referral = require('../models/Referral');

// Register a new user with referrer
router.post('/register', async (req, res) => {
  try {
    const { address, referrerAddress } = req.body;

    if (!address || !referrerAddress) {
      return res.status(400).json({ 
        success: false, 
        message: 'Address and referrer address are required' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ address: address.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already registered' 
      });
    }

    // Create new user
    const user = new User({
      address: address.toLowerCase(),
      referrerAddress: referrerAddress.toLowerCase()
    });

    await user.save();

    // Create referral record
    const referral = new Referral({
      referrerAddress: referrerAddress.toLowerCase(),
      referredAddress: address.toLowerCase(),
      level: 1
    });

    await referral.save();

    // Update referrer's level 1 count
    await User.findOneAndUpdate(
      { address: referrerAddress.toLowerCase() },
      { 
        $inc: { 
          totalReferrals: 1, 
          level1Referrals: 1 
        } 
      }
    );

    // Create referrals for all 10 levels
    let currentReferrer = await User.findOne({ address: referrerAddress.toLowerCase() });
    let currentLevel = 1;

    while (currentReferrer && currentLevel <= 10) {
      if (currentReferrer.referrerAddress !== '0x0000000000000000000000000000000000000000') {
        // Create referral record for this level
        const referral = new Referral({
          referrerAddress: currentReferrer.referrerAddress,
          referredAddress: address.toLowerCase(),
          level: currentLevel + 1
        });

        await referral.save();

        // Update referrer's count for this level
        const levelField = `level${currentLevel + 1}Referrals`;
        await User.findOneAndUpdate(
          { address: currentReferrer.referrerAddress },
          { 
            $inc: { 
              totalReferrals: 1,
              [levelField]: 1 
            } 
          }
        );

        // Move to next level
        currentReferrer = await User.findOne({ address: currentReferrer.referrerAddress });
        currentLevel++;
      } else {
        break;
      }
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: user
    });

  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get user by address
router.get('/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const user = await User.findOne({ address: address.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get user's referral statistics
router.get('/:address/referrals', async (req, res) => {
  try {
    const { address } = req.params;
    const { level } = req.query;

    const user = await User.findOne({ address: address.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let query = { referrerAddress: address.toLowerCase() };
    if (level) {
      query.level = parseInt(level);
    }

    const referrals = await Referral.find(query)
      .sort({ registrationDate: -1 })
      .limit(100);

    const stats = {
      totalReferrals: user.totalReferrals,
      level1Referrals: user.level1Referrals,
      level2Referrals: user.level2Referrals,
      referrals: referrals
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching referrals:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get all users (for admin)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const users = await User.find()
      .sort({ registrationDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments();

    res.json({
      success: true,
      data: {
        users,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;
