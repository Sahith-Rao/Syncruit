import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const JobList = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/jobs', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setJobs(response.data);
    } catch (err) {
      setError('Error fetching jobs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartInterview = (jobId) => {
    navigate(`/interview/${jobId}`);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mt: 4 }}>
        Available Positions
      </Typography>
      <Grid container spacing={3}>
        {jobs.map((job) => (
          <Grid item xs={12} md={6} key={job._id}>
            <Card>
              <CardContent>
                <Typography variant="h5" component="h2" gutterBottom>
                  {job.title}
                </Typography>
                <Typography color="textSecondary" gutterBottom>
                  {job.company}
                </Typography>
                <Typography variant="body2" paragraph>
                  {job.description}
                </Typography>
                <Typography variant="h6" gutterBottom>
                  Requirements:
                </Typography>
                <ul>
                  {job.requirements.map((req, index) => (
                    <li key={index}>
                      <Typography variant="body2">{req}</Typography>
                    </li>
                  ))}
                </ul>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleStartInterview(job._id)}
                  sx={{ mt: 2 }}
                >
                  Start Interview
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default JobList; 