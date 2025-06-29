import express from 'express';
import Candidate from '../models/Candidate.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// GET /api/candidates/:id - Get candidate profile
router.get('/:id', verifyToken, async (req, res) => {
  try {
    // Check if user is requesting their own profile or is an admin
    if (req.userId !== req.params.id && req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to access this profile' });
    }
    
    const candidate = await Candidate.findById(req.params.id).select('-password');
    
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }
    
    res.json(candidate);
  } catch (error) {
    console.error('Error fetching candidate profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /api/candidates/:id - Update candidate profile
router.put('/:id', verifyToken, async (req, res) => {
  try {
    // Check if user is updating their own profile
    if (req.userId !== req.params.id) {
      return res.status(403).json({ message: 'Unauthorized to update this profile' });
    }
    
    const { 
      firstName, 
      lastName, 
      mobile, 
      location, 
      currentPosition, 
      experience, 
      skills,
      summary,
      education,
      certifications
    } = req.body;
    
    // Validate required fields
    if (!firstName || !lastName || !mobile || !location || !currentPosition || !experience || !skills) {
      return res.status(400).json({ message: 'Required fields missing' });
    }
    
    // Create updated candidate object
    const updatedCandidate = {
      firstName,
      lastName,
      name: `${firstName} ${lastName}`, // Update full name for backward compatibility
      mobile,
      location,
      currentPosition,
      experience,
      skills,
      // Optional fields
      summary,
      education,
      certifications
    };
    
    // Update the candidate
    const candidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      updatedCandidate,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }
    
    res.json(candidate);
  } catch (error) {
    console.error('Error updating candidate profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;