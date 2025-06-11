const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { PythonShell } = require('python-shell');
const mongoose = require('mongoose');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Job = require('./models/Job');
const InterviewResponse = require('./models/InterviewResponse');
const { authenticateToken, isAdmin } = require('./middleware/auth');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/jobs');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/interview-prep', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((error) => {
  console.error('MongoDB connection error:', error);
});

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for video upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Not a video file'));
        }
    }
});

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Convert WebM to MP4
const convertToMP4 = (inputPath) => {
    return new Promise((resolve, reject) => {
        const outputPath = inputPath.replace('.webm', '.mp4');
        ffmpeg(inputPath)
            .output(outputPath)
            .on('end', () => {
                // Delete the original WebM file
                fs.unlinkSync(inputPath);
                resolve(outputPath);
            })
            .on('error', (err) => {
                reject(err);
            })
            .run();
    });
};

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);

// Authentication Routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, role } = req.body;
        console.log('Registration attempt:', { email, role });

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('User already exists:', email);
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const user = new User({
            email,
            password: hashedPassword,
            role: role || 'user'
        });

        await user.save();
        console.log('User registered successfully:', { 
            email: user.email, 
            role: user.role,
            id: user._id 
        });

        res.status(201).json({ 
            success: true, 
            message: 'User registered successfully',
            user: {
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Error registering user' });
    }
});

// User Login Route
app.post('/api/auth/user/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('User login attempt:', { email });

        // Find user
        const user = await User.findOne({ email, role: 'user' });
        if (!user) {
            console.log('User not found:', email);
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Password match:', isMatch);
        
        if (!isMatch) {
            console.log('Password mismatch for user:', email);
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Create JWT token
        const token = jwt.sign(
            { userId: user._id, role: 'user' },
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '24h' }
        );

        console.log('User login successful:', { 
            userId: user._id,
            email: user.email 
        });

        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                role: 'user'
            }
        });
    } catch (err) {
        console.error('User login error:', err);
        res.status(500).json({ error: 'Error logging in' });
    }
});

// Admin Login Route
app.post('/api/auth/admin/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Admin login attempt:', { email });

        // Find admin
        const admin = await User.findOne({ email, role: 'admin' });
        if (!admin) {
            console.log('Admin not found:', email);
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, admin.password);
        console.log('Password match:', isMatch);
        
        if (!isMatch) {
            console.log('Password mismatch for admin:', email);
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Create JWT token
        const token = jwt.sign(
            { userId: admin._id, role: 'admin' },
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '24h' }
        );

        console.log('Admin login successful:', { 
            userId: admin._id,
            email: admin.email 
        });

        res.json({
            token,
            user: {
                id: admin._id,
                email: admin.email,
                role: 'admin'
            }
        });
    } catch (err) {
        console.error('Admin login error:', err);
        res.status(500).json({ error: 'Error logging in' });
    }
});

// Job Routes
app.post('/api/jobs', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { title, company, description, requirements, questions } = req.body;
        const job = new Job({
            title,
            company,
            description,
            requirements,
            questions,
            createdBy: req.user.userId
        });
        await job.save();
        res.status(201).json(job);
    } catch (err) {
        res.status(500).json({ error: 'Error creating job' });
    }
});

app.get('/api/jobs', authenticateToken, async (req, res) => {
    try {
        const jobs = await Job.find({ isActive: true });
        res.json(jobs);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching jobs' });
    }
});

app.get('/api/jobs/:jobId/questions/random', authenticateToken, async (req, res) => {
    try {
        const job = await Job.findById(req.params.jobId);
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }
        const randomQuestion = job.questions[Math.floor(Math.random() * job.questions.length)];
        res.json(randomQuestion);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching question' });
    }
});

// Interview Routes
app.post('/api/interviews', authenticateToken, upload.single('video'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No video file uploaded' });
        }

        const { jobId, questionId } = req.body;
        const videoUrl = req.file.path;

        // TODO: Implement video analysis
        const analysis = {
            overall_score: 85,
            detailed_metrics: {
                confidence: 90,
                clarity: 85,
                relevance: 80
            },
            feedback_comments: [
                'Good eye contact',
                'Clear communication',
                'Could improve on specific examples'
            ]
        };

        const response = new InterviewResponse({
            user: req.user.userId,
            job: jobId,
            question: questionId,
            videoUrl,
            analysis
        });

        await response.save();
        res.status(201).json({ analysis });
    } catch (err) {
        res.status(500).json({ error: 'Error submitting interview response' });
    }
});

app.get('/api/interviews', authenticateToken, async (req, res) => {
    try {
        const responses = await InterviewResponse.find({ user: req.user.userId })
            .populate('job')
            .populate('question');
        res.json(responses);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching interview responses' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 