const express = require('express');
const cors = require('cors');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Middleware
app.use(cors());
app.use(express.json());

// Firebase Admin initialization
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

// Log to verify environment variables are loaded
console.log('Firebase Project ID:', process.env.FIREBASE_PROJECT_ID);
console.log('Firebase Client Email:', process.env.FIREBASE_CLIENT_EMAIL);
console.log('Private Key exists:', !!process.env.FIREBASE_PRIVATE_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Register endpoint
app.post('/api/register', upload.single('resume'), async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      currentPosition,
      experience,
      skills,
      location,
      password
    } = req.body;

    // Check if user already exists
    const userRef = db.collection('users');
    const snapshot = await userRef.where('email', '==', email).get();
    
    if (!snapshot.empty) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Upload resume to Cloudinary
    let resumeUrl = '';
    if (req.file) {
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataURI = `data:${req.file.mimetype};base64,${b64}`;
      const result = await cloudinary.uploader.upload(dataURI, {
        resource_type: 'raw',
        format: 'pdf'
      });
      resumeUrl = result.secure_url;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user document
    const userData = {
      firstName,
      lastName,
      email,
      phone,
      currentPosition,
      experience,
      skills: skills.split(',').map(skill => skill.trim()),
      location,
      resumeUrl,
      password: hashedPassword,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await userRef.add(userData);

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const userRef = db.collection('users');
    const snapshot = await userRef.where('email', '==', email).get();

    if (snapshot.empty) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    // Verify password
    const validPassword = await bcrypt.compare(password, userData.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: userDoc.id, email: userData.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: userDoc.id,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Google Login endpoint
app.post('/api/auth/google', async (req, res) => {
  try {
    const { token } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    // Check if user exists
    const userRef = db.collection('users');
    const snapshot = await userRef.where('email', '==', email).get();

    let userId;
    let userData;

    if (snapshot.empty) {
      // Create new user
      const newUser = {
        email,
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(1).join(' '),
        profilePicture: picture,
        googleId,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await userRef.add(newUser);
      userId = docRef.id;
      userData = newUser;
    } else {
      // User exists
      const doc = snapshot.docs[0];
      userId = doc.id;
      userData = doc.data();

      // Update Google ID if not present
      if (!userData.googleId) {
        await doc.ref.update({ googleId });
      }
    }

    // Generate JWT token
    const jwtToken = jwt.sign(
      { userId, email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token: jwtToken,
      user: {
        id: userId,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        profilePicture: userData.profilePicture
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ error: 'Google authentication failed' });
  }
});

// Admin Register
app.post('/api/admin/register', async (req, res) => {
  try {
    const { email, name, password } = req.body;
    const adminRef = db.collection('admins');
    const snapshot = await adminRef.where('email', '==', email).get();

    if (!snapshot.empty) {
      return res.status(400).json({ error: 'Admin already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const adminData = {
      email,
      name,
      password: hashedPassword,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await adminRef.add(adminData);

    res.status(201).json({ message: 'Admin registered successfully' });
  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Admin Login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const adminRef = db.collection('admins');
    const snapshot = await adminRef.where('email', '==', email).get();

    if (snapshot.empty) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const adminDoc = snapshot.docs[0];
    const adminData = adminDoc.data();

    const validPassword = await bcrypt.compare(password, adminData.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { adminId: adminDoc.id, email: adminData.email, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      admin: {
        id: adminDoc.id,
        name: adminData.name,
        email: adminData.email,
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Admin Google Login
app.post('/api/admin/auth/google', async (req, res) => {
  try {
    const { token } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name } = payload;

    // Check if admin exists
    const adminRef = db.collection('admins');
    const snapshot = await adminRef.where('email', '==', email).get();

    let adminId;
    let adminData;

    if (snapshot.empty) {
      // Create new admin
      const newAdmin = {
        email,
        name,
        googleId: payload.sub,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const docRef = await adminRef.add(newAdmin);
      adminId = docRef.id;
      adminData = newAdmin;
    } else {
      // Admin exists
      const doc = snapshot.docs[0];
      adminId = doc.id;
      adminData = doc.data();
    }

    // Generate JWT token
    const jwtToken = jwt.sign(
      { adminId, email, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token: jwtToken,
      admin: {
        id: adminId,
        name: adminData.name,
        email: adminData.email,
      },
    });
  } catch (error) {
    console.error('Admin Google auth error:', error);
    res.status(401).json({ error: 'Google authentication failed' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 