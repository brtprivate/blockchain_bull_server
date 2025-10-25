const express = require('express');
const router = express.Router();
const Investment = require('../models/Investment');
const User = require('../models/User');

// Create a new investment
router.post('/create', async (req, res) => {
  try {
    const { 
      userAddress, 
      investmentAmount, 
      investmentType = 'package', 
      packageIndex = null, 
      transactionHash = null 
    } = req.body;

    if (!userAddress || !investmentAmount) {
      return res.status(400).json({ 
        success: false, 
        message: 'User address and investment amount are required' 
      });
    }

    if (investmentAmount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Investment amount must be greater than 0' 
      });
    }

    // Create new investment
    const investment = new Investment({
      userAddress: userAddress.toLowerCase(),
      investmentAmount,
      investmentType,
      packageIndex,
      transactionHash,
      remainingBalance: investmentAmount
    });

    await investment.save();

    // Update user's total investment
    await User.findOneAndUpdate(
      { address: userAddress.toLowerCase() },
      { 
        $inc: { 
          totalInvestment: investmentAmount 
        } 
      }
    );

    res.status(201).json({
      success: true,
      message: 'Investment created successfully',
      data: investment
    });

  } catch (error) {
    console.error('Error creating investment:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get user's investments
router.get('/user/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { page = 1, limit = 50, type } = req.query;

    let query = { userAddress: address.toLowerCase() };
    if (type) {
      query.investmentType = type;
    }

    const investments = await Investment.find(query)
      .sort({ investmentDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Investment.countDocuments(query);

    // Calculate totals
    const totals = await Investment.aggregate([
      { $match: { userAddress: address.toLowerCase() } },
      {
        $group: {
          _id: null,
          totalInvested: { $sum: '$investmentAmount' },
          totalRoiEarned: { $sum: '$roiEarned' },
          totalWithdrawn: { $sum: '$totalWithdrawn' },
          activeInvestments: { $sum: { $cond: ['$isActive', 1, 0] } }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        investments,
        pagination: {
          totalPages: Math.ceil(total / limit),
          currentPage: page,
          total
        },
        totals: totals[0] || {
          totalInvested: 0,
          totalRoiEarned: 0,
          totalWithdrawn: 0,
          activeInvestments: 0
        }
      }
    });

  } catch (error) {
    console.error('Error fetching investments:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get investment statistics for a user
router.get('/stats/:address', async (req, res) => {
  try {
    const { address } = req.params;

    const stats = await Investment.aggregate([
      { $match: { userAddress: address.toLowerCase() } },
      {
        $group: {
          _id: null,
          totalInvested: { $sum: '$investmentAmount' },
          totalRoiEarned: { $sum: '$roiEarned' },
          totalWithdrawn: { $sum: '$totalWithdrawn' },
          activeInvestments: { $sum: { $cond: ['$isActive', 1, 0] } },
          totalInvestments: { $sum: 1 },
          averageInvestment: { $avg: '$investmentAmount' },
          maxInvestment: { $max: '$investmentAmount' },
          minInvestment: { $min: '$investmentAmount' }
        }
      }
    ]);

    // Get investment by type
    const byType = await Investment.aggregate([
      { $match: { userAddress: address.toLowerCase() } },
      {
        $group: {
          _id: '$investmentType',
          count: { $sum: 1 },
          totalAmount: { $sum: '$investmentAmount' }
        }
      }
    ]);

    // Get recent investments
    const recentInvestments = await Investment.find({ 
      userAddress: address.toLowerCase() 
    })
    .sort({ investmentDate: -1 })
    .limit(10);

    res.json({
      success: true,
      data: {
        stats: stats[0] || {
          totalInvested: 0,
          totalRoiEarned: 0,
          totalWithdrawn: 0,
          activeInvestments: 0,
          totalInvestments: 0,
          averageInvestment: 0,
          maxInvestment: 0,
          minInvestment: 0
        },
        byType,
        recentInvestments
      }
    });

  } catch (error) {
    console.error('Error fetching investment stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Update investment (for ROI, withdrawals, etc.)
router.put('/update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { roiEarned, totalWithdrawn, status, isActive } = req.body;

    const updateData = {};
    if (roiEarned !== undefined) updateData.roiEarned = roiEarned;
    if (totalWithdrawn !== undefined) updateData.totalWithdrawn = totalWithdrawn;
    if (status !== undefined) updateData.status = status;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Calculate remaining balance
    if (roiEarned !== undefined || totalWithdrawn !== undefined) {
      const investment = await Investment.findById(id);
      if (investment) {
        updateData.remainingBalance = investment.investmentAmount + (roiEarned || 0) - (totalWithdrawn || 0);
      }
    }

    const investment = await Investment.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!investment) {
      return res.status(404).json({
        success: false,
        message: 'Investment not found'
      });
    }

    res.json({
      success: true,
      message: 'Investment updated successfully',
      data: investment
    });

  } catch (error) {
    console.error('Error updating investment:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get all investments (for admin)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, status, type } = req.query;

    let query = {};
    if (status) query.status = status;
    if (type) query.investmentType = type;

    const investments = await Investment.find(query)
      .sort({ investmentDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Investment.countDocuments(query);

    res.json({
      success: true,
      data: {
        investments,
        pagination: {
          totalPages: Math.ceil(total / limit),
          currentPage: page,
          total
        }
      }
    });

  } catch (error) {
    console.error('Error fetching investments:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;
