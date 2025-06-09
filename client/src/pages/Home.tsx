import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import axios from 'axios';

const Home: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      if (selectedFile.size > 50 * 1024 * 1024) { // 50MB limit
        setError('File size must be less than 50MB');
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('Please select a video file');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('video', file);

    try {
      const response = await axios.post('http://localhost:5000/api/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Store results in localStorage and navigate to results page
      localStorage.setItem('analysisResults', JSON.stringify(response.data));
      navigate('/results');
    } catch (err) {
      setError('Error analyzing video. Please try again.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          Interview Response Analyzer
        </Typography>
        <Typography variant="h6" align="center" color="text.secondary" paragraph>
          Upload your interview response video to receive detailed feedback on your delivery
        </Typography>
      </Box>

      <Paper
        elevation={3}
        sx={{
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
        }}
      >
        <input
          accept="video/*"
          style={{ display: 'none' }}
          id="video-upload"
          type="file"
          onChange={handleFileChange}
        />
        <label htmlFor="video-upload">
          <Button
            variant="contained"
            component="span"
            startIcon={<CloudUploadIcon />}
            disabled={loading}
          >
            Select Video
          </Button>
        </label>

        {file && (
          <Typography variant="body1">
            Selected file: {file.name}
          </Typography>
        )}

        {error && (
          <Alert severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        )}

        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={!file || loading}
          sx={{ mt: 2 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Analyze Video'}
        </Button>
      </Paper>
    </Container>
  );
};

export default Home; 