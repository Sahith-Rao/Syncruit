const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { verifyToken, isCandidate } = require('../middleware/auth');

// Candidate Register
router.post('/register', verifyToken, async (req, res) => {
  try {
    const { name, email } = req.body;
    const { uid } = req.user;
    
    // Set custom claims for candidate role
    await admin.auth().setCustomUserClaims(uid, { candidate: true });

    res.status(201).json({ message: 'Candidate registered successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Candidate Login
router.post('/login', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    
    // Verify candidate role
    const userRecord = await admin.auth().getUser(uid);
    const customClaims = userRecord.customClaims || {};
    
    if (!customClaims.candidate) {
      return res.status(403).json({ error: 'Access denied. Candidates only.' });
    }

    res.json({ message: 'Candidate login successful' });
  } catch (error) {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Protected candidate route example
router.get('/dashboard', verifyToken, isCandidate, (req, res) => {
  res.json({ message: 'Welcome to candidate dashboard' });
});

module.exports = router; 