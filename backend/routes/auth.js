const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');
const { authenticateToken } = require('../middleware/auth');

// User Registration
router.post('/user/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create new user
    user = new User({
      name,
      email,
      password
    });

    await user.save();

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('User registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// User Login
router.post('/user/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('User login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin Registration
router.post('/admin/register', async (req, res) => {
  try {
    const { name, email, password, company } = req.body;

    // Check if admin already exists
    let admin = await Admin.findOne({ email });
    if (admin) {
      return res.status(400).json({ error: 'Admin already exists' });
    }

    // Create new admin
    admin = new Admin({
      name,
      email,
      password,
      company
    });

    await admin.save();

    // Create JWT token
    const token = jwt.sign(
      { adminId: admin._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        company: admin.company,
        role: 'admin'
      }
    });
  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin Login
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if admin exists
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { adminId: admin._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        company: admin.company,
        role: 'admin'
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user (for both users and admins)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    let user;
    if (req.user.userId) {
      user = await User.findById(req.user.userId).select('-password');
    } else if (req.user.adminId) {
      user = await Admin.findById(req.user.adminId).select('-password');
      user = user.toObject();
      user.role = 'admin';
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 