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
import axios from 'axios';

const AdminRegister = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    company: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/auth/admin/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        company: formData.company
      });

      if (response.data.token) {
        // Store the token in localStorage
        localStorage.setItem('token', response.data.token);
        // Redirect to admin login page
        navigate('/admin/login');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error registering admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Admin Registration
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              label="Name"
              name="name"
              fullWidth
              margin="normal"
              value={formData.name}
              onChange={handleChange}
              required
            />
            
            <TextField
              label="Email"
              name="email"
              type="email"
              fullWidth
              margin="normal"
              value={formData.email}
              onChange={handleChange}
              required
            />
            
            <TextField
              label="Company"
              name="company"
              fullWidth
              margin="normal"
              value={formData.company}
              onChange={handleChange}
              required
            />
            
            <TextField
              label="Password"
              name="password"
              type="password"
              fullWidth
              margin="normal"
              value={formData.password}
              onChange={handleChange}
              required
            />
            
            <TextField
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              fullWidth
              margin="normal"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />

            <Button
              type="submit"
              variant="contained"
              color="secondary"
              fullWidth
              size="large"
              sx={{ mt: 3 }}
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register'}
            </Button>

            <Button
              variant="text"
              fullWidth
              sx={{ mt: 2 }}
              onClick={() => navigate('/admin/login')}
            >
              Already have an account? Login
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

export default AdminRegister; 