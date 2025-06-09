import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Score as ScoreIcon,
  Visibility as VisibilityIcon,
  EmojiEmotions as EmojiEmotionsIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';

interface AnalysisResults {
  overall_score: number;
  detailed_metrics: {
    eye_contact: number;
    confidence: number;
    speech_clarity: number;
    speech_rate: number;
    filler_words: number;
    long_pauses: number;
    dominant_emotion: string;
  };
  feedback_comments: string[];
}

const Results: React.FC = () => {
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedResults = localStorage.getItem('analysisResults');
    if (!storedResults) {
      navigate('/');
      return;
    }

    try {
      setResults(JSON.parse(storedResults));
    } catch (err) {
      setError('Error loading results');
      console.error('Error parsing results:', err);
    }
  }, [navigate]);

  if (error) {
    return (
      <Container maxWidth="md">
        <Alert severity="error" sx={{ mt: 4 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  if (!results) {
    return (
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Analysis Results
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h2" color="primary" gutterBottom>
            {results.overall_score.toFixed(1)}%
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Overall Delivery Score
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          <Box sx={{ flex: '1 1 45%', minWidth: '300px' }}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <VisibilityIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Eye Contact</Typography>
              </Box>
              <Typography variant="h4">{results.detailed_metrics.eye_contact.toFixed(1)}%</Typography>
            </Paper>
          </Box>

          <Box sx={{ flex: '1 1 45%', minWidth: '300px' }}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <EmojiEmotionsIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Confidence</Typography>
              </Box>
              <Typography variant="h4">{results.detailed_metrics.confidence.toFixed(1)}%</Typography>
            </Paper>
          </Box>

          <Box sx={{ flex: '1 1 45%', minWidth: '300px' }}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SpeedIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Speech Rate</Typography>
              </Box>
              <Typography variant="h4">{results.detailed_metrics.speech_rate.toFixed(1)} WPM</Typography>
            </Paper>
          </Box>

          <Box sx={{ flex: '1 1 45%', minWidth: '300px' }}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ScoreIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Speech Clarity</Typography>
              </Box>
              <Typography variant="h4">{results.detailed_metrics.speech_clarity.toFixed(1)}%</Typography>
            </Paper>
          </Box>
        </Box>
      </Paper>

      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Detailed Feedback
        </Typography>
        <List>
          {results.feedback_comments.map((comment, index) => (
            <React.Fragment key={index}>
              <ListItem>
                <ListItemText primary={comment} />
              </ListItem>
              {index < results.feedback_comments.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/')}
          size="large"
        >
          Analyze Another Video
        </Button>
      </Box>
    </Container>
  );
};

export default Results; 