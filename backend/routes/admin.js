const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Admin Register
router.post('/register', verifyToken, async (req, res) => {
  try {
    const { name, email } = req.body;
    const { uid } = req.user;
    
    // Set custom claims for admin role
    await admin.auth().setCustomUserClaims(uid, { admin: true });

    res.status(201).json({ message: 'Admin registered successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Admin Login
router.post('/login', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    
    // Verify admin role
    const userRecord = await admin.auth().getUser(uid);
    const customClaims = userRecord.customClaims || {};
    
    if (!customClaims.admin) {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    res.json({ message: 'Admin login successful' });
  } catch (error) {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Protected admin route example
router.get('/dashboard', verifyToken, isAdmin, (req, res) => {
  res.json({ message: 'Welcome to admin dashboard' });
});

module.exports = router; 