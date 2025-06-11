import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './components/Home';
import UserLogin from './components/UserLogin';
import AdminLogin from './components/AdminLogin';
import UserRegister from './components/UserRegister';
import AdminRegister from './components/AdminRegister';
import JobList from './components/JobList';
import PostJob from './components/PostJob';
import Interview from './components/Interview';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const PrivateRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/jobs" />;
  }

  return children;
};

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <Router>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<UserLogin />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/register" element={<UserRegister />} />
            <Route path="/admin/register" element={<AdminRegister />} />
            <Route 
              path="/jobs" 
              element={
                <PrivateRoute>
                  <JobList />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/post-job" 
              element={
                <PrivateRoute requireAdmin>
                  <PostJob />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/interview/:jobId" 
              element={
                <PrivateRoute>
                  <Interview />
                </PrivateRoute>
              } 
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
