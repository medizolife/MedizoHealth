'use client';
import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Alert, 
  CircularProgress, 
  Container, 
  Divider,
  Chip,
  IconButton,
  InputAdornment
} from '@mui/material';
import { 
  LockOutlined as LockIcon, 
  Person as PersonIcon, 
  MedicalServices as DoctorIcon,
  Visibility,
  VisibilityOff,
  Email as EmailIcon
} from '@mui/icons-material';

const Login = () => {
  const navigate = useNavigate();
  const { authState, login, googleLogin } = useAuth();
  const { loading, error, isAuthenticated } = authState;
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [googleProcessing, setGoogleProcessing] = useState(false);
  
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !password) return;
    await login({ email, password });
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setGoogleError(null);
    setGoogleProcessing(true);
    
    try {
      const result = await googleLogin(credentialResponse.credential);
      
      if (result && result.isNewUser) {
        // New user - redirect to register page with Google data pre-filled
        navigate('/register', { 
          state: { 
            googleData: {
              firstName: result.user.firstName,
              lastName: result.user.lastName,
              email: result.user.email,
              token: result.token,
              user: result.user
            }
          }
        });
      }
      // If result is void, existing user was auto-logged in via AuthContext
    } catch (err: any) {
      console.error('Google login error:', err);
      setGoogleError(err.response?.data?.message || 'Failed to sign in with Google');
    } finally {
      setGoogleProcessing(false);
    }
  };

  const handleGoogleError = () => {
    setGoogleError('Google sign-in was cancelled or failed. Please try again.');
  };

  const handleForgotPassword = () => {
    alert('Password reset link sent to your registered email address.');
  };
  
  return (
    <Box 
      component="main" 
      sx={{ 
        minHeight: 'calc(100dvh - 136px)',
        display: 'flex',
        flexDirection: 'column',
        justify: 'center',
        alignItems: 'center',
        px: 2,
        py: 1,
        boxSizing: 'border-box'
      }} 
      className="animate-slide-up"
    >
      <Paper 
        elevation={0} 
        className="glass-panel"
        sx={{ 
          width: '100%',
          maxWidth: 380,
          p: { xs: 2.25, sm: 3 }, 
          borderRadius: '24px !important', 
          bgcolor: 'rgba(255, 255, 255, 0.92) !important',
          border: '1px solid rgba(137, 215, 183, 0.4) !important',
          boxShadow: '0 12px 32px rgba(26, 49, 44, 0.08) !important'
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 1.5 }}>
          <Box
            component="img"
            src="/LOGO.png"
            alt="Medizo Logo"
            sx={{ 
              width: 42, 
              height: 42, 
              borderRadius: '12px', 
              mb: 0.75,
              border: '2px solid #89D7B7',
              boxShadow: '0 4px 12px rgba(66, 132, 117, 0.18)'
            }}
          />
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#1A312C', letterSpacing: '-0.02em', fontSize: '1.15rem' }}>
            Welcome to Medizo
          </Typography>
          <Typography variant="caption" sx={{ color: '#428475', fontWeight: 600, display: 'block', mt: 0.1, fontSize: '0.75rem' }}>
            Sign in to access your digital prescriptions
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 1.25, py: 0.25, borderRadius: '12px', bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#b91c1c', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            {error}
          </Alert>
        )}

        {googleError && (
          <Alert severity="error" sx={{ mb: 1.25, py: 0.25, borderRadius: '12px', bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#b91c1c', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            {googleError}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            margin="dense"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            placeholder="Enter your email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            InputLabelProps={{
              sx: { color: '#2A6B5D', fontWeight: 600, fontSize: '0.85rem' }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon sx={{ color: '#428475', fontSize: 18 }} />
                </InputAdornment>
              ),
              sx: { 
                borderRadius: '14px',
                bgcolor: 'rgba(255, 255, 255, 0.95)',
                color: '#123029',
                fontSize: '0.9rem',
                '& input::placeholder': {
                  color: '#4D9B8C',
                  opacity: 0.85,
                  fontWeight: 500,
                },
                '& fieldset': { borderColor: 'rgba(137, 215, 183, 0.5)' },
                '&:hover fieldset': { borderColor: '#428475 !important' }
              }
            }}
          />
          
          <TextField
            margin="dense"
            required
            fullWidth
            name="password"
            label="Password"
            placeholder="Enter your password"
            type={showPassword ? 'text' : 'password'}
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            InputLabelProps={{
              sx: { color: '#2A6B5D', fontWeight: 600, fontSize: '0.85rem' }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon sx={{ color: '#428475', fontSize: 18 }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    size="small"
                    sx={{ color: '#428475' }}
                  >
                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
              sx: { 
                borderRadius: '14px',
                bgcolor: 'rgba(255, 255, 255, 0.95)',
                color: '#123029',
                fontSize: '0.9rem',
                '& input::placeholder': {
                  color: '#4D9B8C',
                  opacity: 0.85,
                  fontWeight: 500,
                },
                '& fieldset': { borderColor: 'rgba(137, 215, 183, 0.5)' },
                '&:hover fieldset': { borderColor: '#428475 !important' }
              }
            }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.25, mb: 0.5 }}>
            <Typography
              variant="caption"
              onClick={handleForgotPassword}
              sx={{
                color: '#428475',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '0.725rem',
                '&:hover': { color: '#1A312C', textDecoration: 'underline' }
              }}
            >
              Forgot Password?
            </Typography>
          </Box>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="medium"
            disabled={loading}
            sx={{ 
              mt: 1.25, 
              mb: 1.25, 
              height: 44, 
              bgcolor: '#1A312C', 
              color: '#89D7B7',
              borderRadius: '14px',
              fontSize: '0.9rem',
              fontWeight: 800,
              boxShadow: '0 6px 18px rgba(26, 49, 44, 0.2)',
              border: '1px solid #89D7B7',
              '&:hover': { bgcolor: '#0F1D1A' } 
            }}
          >
            {loading ? <CircularProgress size={20} sx={{ color: '#89D7B7' }} /> : 'Sign In'}
          </Button>

          {/* Google Sign-In Divider */}
          <Divider sx={{ my: 1, borderColor: 'rgba(137, 215, 183, 0.3)' }}>
            <Typography variant="caption" sx={{ color: '#428475', fontWeight: 700, px: 1, fontSize: '0.675rem' }}>
              OR
            </Typography>
          </Divider>

          {/* Google Sign-In Button */}
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', my: 1.25 }}>
            {googleProcessing ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={20} sx={{ color: '#428475' }} />
                <Typography variant="caption" sx={{ color: '#428475', fontWeight: 600 }}>
                  Signing in with Google...
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
                width="320"
              />
            )}
          </Box>

          <Divider sx={{ my: 1.25, borderColor: 'rgba(137, 215, 183, 0.3)' }}>
            <Typography variant="caption" sx={{ color: '#428475', fontWeight: 700, px: 1, fontSize: '0.675rem' }}>
              NEW TO MEDIZO?
            </Typography>
          </Divider>

          <Button
            component={RouterLink}
            to="/register"
            fullWidth
            variant="outlined"
            size="medium"
            sx={{ 
              height: 42, 
              borderColor: '#428475', 
              color: '#1A312C',
              borderRadius: '14px',
              fontWeight: 800,
              borderWidth: '1.5px',
              fontSize: '0.85rem',
              '&:hover': { bgcolor: 'rgba(137, 215, 183, 0.15)', borderColor: '#1A312C' }
            }}
          >
            Create New Account
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default Login;
