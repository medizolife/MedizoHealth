'use client';
import React, { useState, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import {
  Box,
  Typography,
  Divider,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  CircularProgress
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Google Login Button Component
 * Provides Google OAuth sign-in functionality with role selection for new users
 */
const GoogleLoginButton = ({ onSuccess, onClose, showRoleSelection = true, defaultRole = 'patient' }) => {
  const { googleLogin, loading } = useAuth();
  const [selectedRole, setSelectedRole] = useState(defaultRole);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Update selectedRole when defaultRole prop changes
  useEffect(() => {
    setSelectedRole(defaultRole);
  }, [defaultRole]);

  const handleGoogleSuccess = async (credentialResponse) => {
    setError(null);
    setIsProcessing(true);
    
    try {
      await googleLogin(credentialResponse.credential, selectedRole);
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      console.error('Google login error:', err);
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google sign-in was cancelled or failed. Please try again.');
  };

  return (
    <Box sx={{ mt: 2, mb: 2 }}>
      <Divider sx={{ my: 2 }}>
        <Typography variant="body2" color="text.secondary">
          OR
        </Typography>
      </Divider>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {showRoleSelection && (
        <FormControl component="fieldset" sx={{ mb: 2, width: '100%' }}>
          <FormLabel component="legend" sx={{ fontSize: '0.875rem' }}>
            Sign up as:
          </FormLabel>
          <RadioGroup
            row
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            <FormControlLabel 
              value="patient" 
              control={<Radio size="small" />} 
              label="Patient" 
            />
            <FormControlLabel 
              value="doctor" 
              control={<Radio size="small" />} 
              label="Doctor" 
            />
            <FormControlLabel 
              value="pharmacist" 
              control={<Radio size="small" />} 
              label="Pharmacist" 
            />
          </RadioGroup>
        </FormControl>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {(loading || isProcessing) ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={24} />
            <Typography variant="body2" color="text.secondary">
              Signing in...
            </Typography>
          </Box>
        ) : (
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            useOneTap={false}
            theme="outline"
            size="large"
            text="continue_with"
            shape="rectangular"
            width="300"
          />
        )}
      </Box>

      <Typography 
        variant="caption" 
        color="text.secondary" 
        sx={{ display: 'block', textAlign: 'center', mt: 1 }}
      >
        By continuing, you agree to our Terms of Service
      </Typography>
    </Box>
  );
};

export default GoogleLoginButton;
