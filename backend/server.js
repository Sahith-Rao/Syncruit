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
const auth = require('./middleware/auth');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
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

// Authentication Routes
app.post('/api/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Create new user
        const user = new User({ email, password, name });
        await user.save();

        // Generate token
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        
        res.status(201).json({ user: { id: user._id, email: user.email, name: user.name }, token });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        
        res.json({ user: { id: user._id, email: user.email, name: user.name }, token });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Protected Routes
app.post('/api/analyze', auth, upload.single('video'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No video file uploaded' });
        }

        const videoPath = req.file.path;
        let processedVideoPath = videoPath;

        // Convert WebM to MP4 if necessary
        if (videoPath.endsWith('.webm')) {
            try {
                processedVideoPath = await convertToMP4(videoPath);
            } catch (err) {
                console.error('Error converting video:', err);
                return res.status(500).json({ error: 'Error processing video' });
            }
        }
        
        // Run Python script
        const options = {
            mode: 'text',
            pythonPath: 'python3',
            pythonOptions: ['-u'],
            scriptPath: path.join(__dirname, '..'),
            args: [processedVideoPath]
        };

        PythonShell.run('hr_analyzer.py', options).then(results => {
            // Clean up the processed file
            if (fs.existsSync(processedVideoPath)) {
                fs.unlinkSync(processedVideoPath);
            }
            
            // Parse the results
            const feedback = JSON.parse(results[0]);
            res.json(feedback);
        }).catch(err => {
            console.error('Error running Python script:', err);
            res.status(500).json({ error: 'Error analyzing video' });
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
}); 