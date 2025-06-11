import React from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Paper
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Typography variant="h2" component="h1" gutterBottom align="center">
          Welcome to Interview Prep
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom align="center" color="text.secondary">
          Practice your interview skills with AI-powered feedback
        </Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 4, height: '100%' }}>
            <Typography variant="h4" component="h2" gutterBottom>
              For Job Seekers
            </Typography>
            <Typography variant="body1" paragraph>
              Practice your interview skills with our AI-powered platform. Get instant feedback on your responses and improve your chances of landing your dream job.
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                onClick={() => navigate('/login')}
                sx={{ mb: 2 }}
              >
                Login
              </Button>
              <Button
                variant="outlined"
                color="primary"
                fullWidth
                size="large"
                onClick={() => navigate('/register')}
              >
                Register
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 4, height: '100%' }}>
            <Typography variant="h4" component="h2" gutterBottom>
              For Employers
            </Typography>
            <Typography variant="body1" paragraph>
              Post job openings and create custom interview questions. Review candidate responses and make informed hiring decisions.
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                color="secondary"
                fullWidth
                size="large"
                onClick={() => navigate('/admin/login')}
                sx={{ mb: 2 }}
              >
                Admin Login
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                fullWidth
                size="large"
                onClick={() => navigate('/admin/register')}
              >
                Admin Register
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Home; 