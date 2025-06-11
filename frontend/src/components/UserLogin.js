import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const UserLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/auth/user/login', {
        email,
        password
      });

      if (response.data.token) {
        login(response.data.token, response.data.user);
        navigate('/jobs', { replace: true });
      } else {
        setError('Invalid response from server');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error logging in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            User Login
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            
            <TextField
              label="Password"
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              sx={{ mt: 3 }}
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>

            <Button
              variant="text"
              fullWidth
              sx={{ mt: 2 }}
              onClick={() => navigate('/register')}
            >
              Don't have an account? Register
            </Button>

            <Button
              variant="text"
              fullWidth
              sx={{ mt: 1 }}
              onClick={() => navigate('/')}
            >
              Back to Home
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default UserLogin; 