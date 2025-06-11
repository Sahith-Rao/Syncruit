import React from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Grid
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          py: 4
        }}
      >
        <Typography
          variant="h2"
          component="h1"
          gutterBottom
          align="center"
          sx={{ mb: 6 }}
        >
          Interview Practice Platform
        </Typography>

        <Grid container spacing={4} justifyContent="center">
          <Grid item xs={12} md={6}>
            <Paper
              sx={{
                p: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.02)',
                  boxShadow: 3
                }
              }}
              onClick={() => navigate('/user/login')}
            >
              <PersonIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              <Typography variant="h4" component="h2" gutterBottom>
                User
              </Typography>
              <Typography variant="body1" color="text.secondary" align="center">
                Practice interviews, record responses, and get feedback on your performance
              </Typography>
              <Button
                variant="contained"
                size="large"
                sx={{ mt: 3 }}
                fullWidth
              >
                Continue as User
              </Button>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper
              sx={{
                p: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.02)',
                  boxShadow: 3
                }
              }}
              onClick={() => navigate('/admin/login')}
            >
              <AdminPanelSettingsIcon sx={{ fontSize: 60, color: 'secondary.main', mb: 2 }} />
              <Typography variant="h4" component="h2" gutterBottom>
                Admin
              </Typography>
              <Typography variant="body1" color="text.secondary" align="center">
                Post job openings, manage interview questions, and review candidate responses
              </Typography>
              <Button
                variant="contained"
                color="secondary"
                size="large"
                sx={{ mt: 3 }}
                fullWidth
              >
                Continue as Admin
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default LandingPage; 