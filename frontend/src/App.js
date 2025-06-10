import React, { useState, useRef } from 'react';
import { 
  Container, 
  Box, 
  Button, 
  Typography, 
  Paper, 
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert
} from '@mui/material';
import axios from 'axios';

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        setVideoBlob(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      setError('Error accessing camera and microphone');
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      streamRef.current.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const analyzeVideo = async () => {
    if (!videoBlob) return;

    setLoading(true);
    setError(null);
    setAnalysis(null);

    const formData = new FormData();
    formData.append('video', videoBlob, 'interview.webm');

    try {
      const response = await axios.post('http://localhost:5000/api/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data && response.data.error) {
        setError(response.data.error);
      } else if (response.data) {
        setAnalysis(response.data);
      } else {
        setError('Invalid response from server');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error analyzing video');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderAnalysis = () => {
    if (!analysis) return null;

    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Analysis Results
        </Typography>
        
        <Typography variant="h6" color="primary" gutterBottom>
          Overall Score: {analysis.overall_score}/100
        </Typography>

        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          Detailed Metrics:
        </Typography>
        <List>
          {analysis.detailed_metrics && Object.entries(analysis.detailed_metrics).map(([key, value]) => (
            <ListItem key={key}>
              <ListItemText
                primary={key.replace(/_/g, ' ').toUpperCase()}
                secondary={value}
              />
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" gutterBottom>
          Feedback Comments:
        </Typography>
        <List>
          {analysis.feedback_comments && analysis.feedback_comments.map((comment, index) => (
            <ListItem key={index}>
              <ListItemText primary={comment} />
            </ListItem>
          ))}
        </List>
      </Paper>
    );
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Interview Practice Analyzer
        </Typography>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <video
              ref={videoRef}
              autoPlay
              muted
              style={{ width: '100%', maxWidth: '640px', backgroundColor: '#000' }}
            />
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            {!isRecording ? (
              <Button
                variant="contained"
                color="primary"
                onClick={startRecording}
                disabled={loading}
              >
                Start Recording
              </Button>
            ) : (
              <Button
                variant="contained"
                color="error"
                onClick={stopRecording}
              >
                Stop Recording
              </Button>
            )}

            <Button
              variant="contained"
              color="secondary"
              onClick={analyzeVideo}
              disabled={!videoBlob || loading}
            >
              Analyze Video
            </Button>
          </Box>
        </Paper>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ my: 2 }}>
            {error}
          </Alert>
        )}

        {renderAnalysis()}
      </Box>
    </Container>
  );
}

export default App;
