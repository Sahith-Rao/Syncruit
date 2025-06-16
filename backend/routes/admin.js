const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { db } = require('../server');

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

// Get all jobs posted by this admin
router.get('/jobs', verifyToken, isAdmin, async (req, res) => {
  try {
    const snapshot = await db.collection('jobs').where('adminUid', '==', req.user.uid).get();
    const jobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ jobs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// Post a new job
router.post('/jobs', verifyToken, isAdmin, async (req, res) => {
  const { title, location, salaryRange, description } = req.body;
  if (!title || !location || !salaryRange || !description) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  try {
    const job = {
      title,
      location,
      salaryRange,
      description,
      adminUid: req.user.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    const docRef = await db.collection('jobs').add(job);
    res.status(201).json({ message: 'Job posted successfully', job: { id: docRef.id, ...job } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to post job' });
  }
});

// Edit a job by id
router.put('/jobs/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { title, location, salaryRange, description } = req.body;
  try {
    const jobRef = db.collection('jobs').doc(id);
    const jobDoc = await jobRef.get();
    if (!jobDoc.exists || jobDoc.data().adminUid !== req.user.uid) {
      return res.status(404).json({ error: 'Job not found' });
    }
    await jobRef.update({ title, location, salaryRange, description });
    res.json({ message: 'Job updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update job' });
  }
});

// Delete a job by id
router.delete('/jobs/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const jobRef = db.collection('jobs').doc(id);
    const jobDoc = await jobRef.get();
    if (!jobDoc.exists || jobDoc.data().adminUid !== req.user.uid) {
      return res.status(404).json({ error: 'Job not found' });
    }
    await jobRef.delete();
    res.json({ message: 'Job deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete job' });
  }
});

module.exports = router; 