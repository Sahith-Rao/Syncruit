import React, { useState, useRef, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
  Card,
  CardContent
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';

const Interview = () => {
  const [question, setQuestion] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const { token } = useAuth();
  const { jobId } = useParams();
  const navigate = useNavigate();
  
  const mediaRecorderRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    fetchQuestion();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [jobId]);

  const fetchQuestion = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/jobs/${jobId}/questions/random`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setQuestion(response.data);
      setTimeLeft(response.data.timeLimit);
    } catch (err) {
      setError('Error fetching question');
      console.error(err);
    }
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          stopRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

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
      startTimer();
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
      clearInterval(timerRef.current);
    }
  };

  const submitResponse = async () => {
    if (!videoBlob) return;

    setLoading(true);
    setError(null);
    setAnalysis(null);

    const formData = new FormData();
    formData.append('video', videoBlob, 'interview.webm');
    formData.append('jobId', jobId);
    formData.append('questionId', question._id);

    try {
      const response = await axios.post('http://localhost:5000/api/interviews', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
      });

      if (response.data && response.data.error) {
        setError(response.data.error);
      } else if (response.data) {
        setAnalysis(response.data.analysis);
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
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Analysis Results
          </Typography>
          
          <Typography variant="h6" color="primary" gutterBottom>
            Overall Score: {analysis.overall_score}/100
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Detailed Metrics:
          </Typography>
          {Object.entries(analysis.detailed_metrics).map(([key, value]) => (
            <Typography key={key} variant="body1" gutterBottom>
              {key.replace(/_/g, ' ').toUpperCase()}: {value}
            </Typography>
          ))}

          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Feedback Comments:
          </Typography>
          {analysis.feedback_comments.map((comment, index) => (
            <Typography key={index} variant="body1" gutterBottom>
              • {comment}
            </Typography>
          ))}

          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/jobs')}
            sx={{ mt: 3 }}
          >
            Back to Jobs
          </Button>
        </CardContent>
      </Card>
    );
  };

  if (!question) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Interview Question
          </Typography>
          <Typography variant="body1" paragraph>
            {question.question}
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Category: {question.category}
          </Typography>
          {timeLeft !== null && (
            <Typography variant="subtitle1" color="primary">
              Time Left: {timeLeft} seconds
            </Typography>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2, mt: 3 }}>
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
              onClick={submitResponse}
              disabled={!videoBlob || loading}
            >
              Submit Response
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
};

export default Interview; 