const express = require('express');
const router = express.Router();
const Referral = require('../models/Referral');
const User = require('../models/User');

// Get referral statistics for a user
router.get('/stats/:address', async (req, res) => {
  try {
    const { address } = req.params;

    const user = await User.findOne({ address: address.toLowerCase() });

    // Get referrals for all 10 levels (even if user doesn't exist)
    const allLevelReferrals = {};
    const levelCounts = {};

    for (let level = 1; level <= 10; level++) {
      const referrals = await Referral.find({
        referrerAddress: address.toLowerCase(),
        level: level
      }).sort({ registrationDate: -1 });

      allLevelReferrals[`level${level}Referrals`] = referrals;
      levelCounts[`level${level}Count`] = referrals.length;
    }

    // Get total commission earned
    const totalCommission = await Referral.aggregate([
      { $match: { referrerAddress: address.toLowerCase() } },
      { $group: { _id: null, total: { $sum: '$commissionEarned' } } }
    ]);

    const stats = {
      totalReferrals: user?.totalReferrals || 0,
      ...levelCounts,
      ...allLevelReferrals,
      totalCommission: totalCommission[0]?.total || 0,
      registrationDate: user?.registrationDate || null,
      totalInvestment: user?.totalInvestment || 0,
      totalEarnings: user?.totalEarnings || 0,
      userExists: !!user
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching referral stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get level-wise referral data for a user
router.get('/level-wise/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { level } = req.query;

    const user = await User.findOne({ address: address.toLowerCase() });

    // If specific level is requested
    if (level) {
      const referrals = await Referral.find({
        referrerAddress: address.toLowerCase(),
        level: parseInt(level)
      }).sort({ registrationDate: -1 });

      return res.json({
        success: true,
        data: {
          level: parseInt(level),
          referrals: referrals,
          count: referrals.length,
          userExists: !!user
        }
      });
    }

    // Get all levels data
    const levelWiseData = {};
    for (let i = 1; i <= 10; i++) {
      const referrals = await Referral.find({
        referrerAddress: address.toLowerCase(),
        level: i
      }).sort({ registrationDate: -1 });

      levelWiseData[`level${i}`] = {
        referrals: referrals,
        count: referrals.length
      };
    }

    res.json({
      success: true,
      data: {
        ...levelWiseData,
        userExists: !!user,
        totalLevels: 10
      }
    });

  } catch (error) {
    console.error('Error fetching level-wise referrals:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get referral tree (hierarchical structure)
router.get('/tree/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { maxDepth = 3 } = req.query;

    const buildReferralTree = async (userAddress, currentDepth = 0) => {
      if (currentDepth >= maxDepth) return null;

      const user = await User.findOne({ address: userAddress.toLowerCase() });
      if (!user) return null;

      const directReferrals = await Referral.find({
        referrerAddress: userAddress.toLowerCase(),
        level: 1
      });

      const children = [];
      for (const referral of directReferrals) {
        const childTree = await buildReferralTree(referral.referredAddress, currentDepth + 1);
        children.push({
          address: referral.referredAddress,
          registrationDate: referral.registrationDate,
          children: childTree?.children || []
        });
      }

      return {
        address: userAddress,
        registrationDate: user.registrationDate,
        totalReferrals: user.totalReferrals,
        level1Referrals: user.level1Referrals,
        level2Referrals: user.level2Referrals,
        children
      };
    };

    const tree = await buildReferralTree(address);

    // Even if user doesn't exist, return empty tree structure
    if (!tree) {
      return res.json({
        success: true,
        data: {
          address: address,
          registrationDate: null,
          totalReferrals: 0,
          level1Referrals: 0,
          level2Referrals: 0,
          children: [],
          userExists: false
        }
      });
    }

    res.json({
      success: true,
      data: {
        ...tree,
        userExists: true
      }
    });

  } catch (error) {
    console.error('Error building referral tree:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get top referrers
router.get('/top', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const topReferrers = await User.find()
      .sort({ totalReferrals: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: topReferrers
    });

  } catch (error) {
    console.error('Error fetching top referrers:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Update commission for a referral
router.put('/commission', async (req, res) => {
  try {
    const { referrerAddress, referredAddress, commission } = req.body;

    const referral = await Referral.findOneAndUpdate(
      {
        referrerAddress: referrerAddress.toLowerCase(),
        referredAddress: referredAddress.toLowerCase()
      },
      { $inc: { commissionEarned: commission } },
      { new: true }
    );

    if (!referral) {
      return res.status(404).json({
        success: false,
        message: 'Referral not found'
      });
    }

    // Update user's total earnings
    await User.findOneAndUpdate(
      { address: referrerAddress.toLowerCase() },
      { $inc: { totalEarnings: commission } }
    );

    res.json({
      success: true,
      message: 'Commission updated successfully',
      data: referral
    });

  } catch (error) {
    console.error('Error updating commission:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;
