import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import http from 'http';

import authRoutes from './routes/auth.js';
import jobsRoutes from './routes/jobs.js';
import analyzeRoutes from './routes/analyze.js';

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/analyze-interview', analyzeRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch((err) => console.error('MongoDB connection error:', err));

// Set timeout to 10 minutes (600000 ms) for long-running requests
const server = http.createServer(app);
server.setTimeout(600000); // 10 minutes

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 