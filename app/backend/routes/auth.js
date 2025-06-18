import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import Admin from '../models/Admin.js';
import Candidate from '../models/Candidate.js';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();
// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ storage: multer.memoryStorage() });

// Helper to promisify cloudinary upload_stream
function uploadToCloudinary(fileBuffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: 'raw' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
}

// Register Admin
router.post('/register/admin', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'All fields required' });
    const existing = await Admin.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already registered' });
    const hashed = await bcrypt.hash(password, 10);
    const admin = new Admin({ name, email, password: hashed });
    await admin.save();
    res.status(201).json({ message: 'Admin registered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Register Candidate (with resume upload)
router.post('/register/candidate', upload.single('resume'), async (req, res) => {
  try {
    const { name, email, password, firstName, lastName, mobile, currentPosition, experience, skills } = req.body;
    if (!name || !email || !password || !firstName || !lastName || !req.file) return res.status(400).json({ message: 'All fields required' });
    const existing = await Candidate.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already registered' });
    // Upload resume to Cloudinary
    let uploadResult;
    try {
      uploadResult = await uploadToCloudinary(req.file.buffer);
    } catch (error) {
      return res.status(500).json({ message: 'Cloudinary error', error });
    }
    const hashed = await bcrypt.hash(password, 10);
    const candidate = new Candidate({
      firstName,
      lastName,
      name,
      email,
      mobile,
      currentPosition,
      experience,
      skills,
      password: hashed,
      resumeUrl: uploadResult.secure_url
    });
    await candidate.save();
    res.status(201).json({ message: 'Candidate registered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Login (Admin or Candidate)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'All fields required' });
    // Try admin first
    let user = await Admin.findOne({ email });
    let role = 'admin';
    if (!user) {
      user = await Candidate.findOne({ email });
      role = 'candidate';
    }
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id, role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role, resumeUrl: user.resumeUrl } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router; 