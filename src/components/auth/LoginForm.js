'use client';
import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Alert
} from '@mui/material';
import { PersonOutline, LockOutlined } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import GoogleLoginButton from './GoogleLoginButton';

const LoginForm = ({ onSwitchToRegister, onClose, defaultRole = 'patient' }) => {
  const { login, loading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    if (error) clearError();
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      return;
    }

    try {
      await login(formData.email, formData.password);
      if (onClose) onClose();
    } catch (error) {
      // Error is handled by context
    }
  };
  
  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom align="center">
        Login to Your Account
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          fullWidth
          margin="normal"
          label="Email Address"
          name="email"
          type="email"
          variant="outlined"
          value={formData.email}
          onChange={handleChange}
          InputProps={{
            startAdornment: <PersonOutline sx={{ mr: 1, color: 'text.secondary' }} />
          }}
          required
        />
        
        <TextField
          fullWidth
          margin="normal"
          label="Password"
          name="password"
          type="password"
          variant="outlined"
          value={formData.password}
          onChange={handleChange}
          InputProps={{
            startAdornment: <LockOutlined sx={{ mr: 1, color: 'text.secondary' }} />
          }}
          required
        />
        
        <Button
          type="submit"
          fullWidth
          variant="contained"
          color="primary"
          size="large"
          sx={{ mt: 3, mb: 2 }}
          disabled={loading || !formData.email || !formData.password}
        >
          {loading ? <CircularProgress size={24} /> : 'Login'}
        </Button>

        {/* Google Login Button */}
        <GoogleLoginButton onClose={onClose} showRoleSelection={true} defaultRole={defaultRole} />
        
        <Grid container justifyContent="flex-end">
          <Grid item>
            <Typography variant="body2">
              Don't have an account? <Button 
                color="primary" 
                sx={{ p: 0, minWidth: 'auto' }} 
                onClick={() => onSwitchToRegister && onSwitchToRegister()}
              >
                Sign Up
              </Button>
            </Typography>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default LoginForm;
