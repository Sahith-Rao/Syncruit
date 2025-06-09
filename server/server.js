const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { PythonShell } = require('python-shell');
const fs = require('fs');
const os = require('os');

const app = express();
const port = process.env.PORT || 5000;

// Set Matplotlib config directory to a writable location
process.env.MPLCONFIGDIR = path.join(os.tmpdir(), 'matplotlib');

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for video upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
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
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Routes
app.post('/api/analyze', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    const videoPath = req.file.path;
    
    // Run Python script
    const options = {
      mode: 'text',
      pythonPath: 'python3',
      pythonOptions: ['-u'],
      scriptPath: path.join(__dirname, '..'),
      args: [videoPath]
    };

    PythonShell.run('hr_analyzer.py', options).then(results => {
      // Clean up the uploaded file
      fs.unlinkSync(videoPath);
      
      try {
        // Get the last line of output, which should be our JSON
        const lastLine = results[results.length - 1];
        const feedback = JSON.parse(lastLine);
        
        if (feedback.error) {
          res.status(400).json({ error: feedback.error });
        } else {
          res.json(feedback);
        }
      } catch (err) {
        console.error('Error parsing Python output:', err);
        console.error('Raw output:', results);
        res.status(500).json({ error: 'Error processing video analysis results' });
      }
    }).catch(err => {
      console.error('Error running Python script:', err);
      res.status(500).json({ error: 'Error analyzing video' });
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 