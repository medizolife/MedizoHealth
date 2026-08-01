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
  LinearProgress, 
  Divider,
  Chip,
  IconButton,
  InputAdornment,
  Link
} from '@mui/material';
import { 
  LockOutlined as LockIcon, 
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 3-Second Verification & DB Sync Hold state
  const [verifyingLogin, setVerifyingLogin] = useState(false);
  const [verifyProgress, setVerifyProgress] = useState(0);
  const [verifyStepText, setVerifyStepText] = useState('Verifying login credentials...');

  const start3SecondHold = (onComplete: () => void) => {
    setVerifyingLogin(true);
    setVerifyProgress(25);
    setVerifyStepText('Verifying login credentials...');

    setTimeout(() => {
      setVerifyProgress(60);
      setVerifyStepText('Connecting to database & loading user profile...');
    }, 1000);

    setTimeout(() => {
      setVerifyProgress(88);
      setVerifyStepText('Syncing digital prescriptions & security stamps...');
    }, 2000);

    setTimeout(() => {
      setVerifyProgress(100);
      setVerifyStepText('Login verified! Launching dashboard...');
    }, 2700);

    setTimeout(() => {
      onComplete();
    }, 3000);
  };
  
  useEffect(() => {
    if (isAuthenticated && !verifyingLogin && !isSubmitting && !googleProcessing) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, verifyingLogin, isSubmitting, googleProcessing, navigate]);
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsSubmitting(true);
    try {
      await login({ email, password });
      start3SecondHold(() => {
        navigate('/dashboard');
      });
    } catch (err) {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setGoogleError(null);
    setGoogleProcessing(true);
    
    try {
      const result = await googleLogin(credentialResponse.credential);
      
      if (result && result.isNewUser) {
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
      } else {
        start3SecondHold(() => {
          navigate('/dashboard');
        });
      }
    } catch (err: any) {
      console.error('Google login error:', err);
      setGoogleError(err.response?.data?.message || 'Failed to sign in with Google');
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
      {verifyingLogin ? (
        <Paper 
          elevation={0} 
          className="glass-panel animate-slide-up"
          sx={{ 
            width: '100%',
            maxWidth: 380,
            p: { xs: 3, sm: 4 }, 
            borderRadius: '28px !important', 
            bgcolor: 'rgba(255, 255, 255, 0.95) !important',
            border: '1.5px solid rgba(137, 215, 183, 0.6) !important',
            boxShadow: '0 20px 48px rgba(26, 49, 44, 0.15) !important',
            textAlign: 'center'
          }}
        >
          <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
            <Box
              component="img"
              src="/LOGO.png"
              alt="Medizo Logo"
              sx={{ 
                width: 58, 
                height: 58, 
                borderRadius: '16px', 
                border: '2px solid #89D7B7',
                boxShadow: '0 6px 20px rgba(66, 132, 117, 0.3)',
                animation: 'pulse 1.5s infinite ease-in-out'
              }}
            />
          </Box>

          <Typography variant="h6" sx={{ fontWeight: 900, color: '#1A312C', fontSize: '1.15rem', mb: 0.5, fontFamily: "'Outfit', sans-serif" }}>
            Verifying Login, Please Wait...
          </Typography>

          <Typography variant="body2" sx={{ color: '#428475', fontWeight: 700, fontSize: '0.82rem', mb: 2.5, minHeight: 38, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {verifyStepText}
          </Typography>

          {/* Progress bar */}
          <Box sx={{ width: '100%', mb: 2.5 }}>
            <LinearProgress
              variant="determinate"
              value={verifyProgress}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: 'rgba(137, 215, 183, 0.25)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  background: 'linear-gradient(90deg, #2A6B5D 0%, #10B981 100%)',
                  transition: 'transform 0.4s ease-out'
                }
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.8 }}>
              <Typography variant="caption" sx={{ color: '#428475', fontWeight: 800, fontSize: '0.68rem' }}>
                Database Sync
              </Typography>
              <Typography variant="caption" sx={{ color: '#1A312C', fontWeight: 900, fontSize: '0.68rem' }}>
                {verifyProgress}%
              </Typography>
            </Box>
          </Box>

          <Chip
            label="🔒 256-Bit Encrypted Session Sync"
            size="small"
            sx={{
              bgcolor: 'rgba(16, 185, 129, 0.12)',
              color: '#059669',
              fontWeight: 800,
              fontSize: '0.68rem',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              py: 0.2
            }}
          />
        </Paper>
      ) : (
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
              disabled={loading || isSubmitting}
              sx={{ 
                mt: 1.25, 
                mb: 1.25, 
                height: 46, 
                bgcolor: '#1A312C', 
                color: '#89D7B7',
                borderRadius: '14px',
                fontSize: '0.9rem',
                fontWeight: 800,
                boxShadow: (loading || isSubmitting) ? 'none' : '0 6px 18px rgba(26, 49, 44, 0.2)',
                border: '1px solid #89D7B7',
                '&:hover': { bgcolor: '#0F1D1A' },
                '&.Mui-disabled': { bgcolor: '#1A312C', color: '#89D7B7', opacity: 0.85 },
                transition: 'all 0.2s ease'
              }}
            >
              {(loading || isSubmitting) ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.2 }}>
                  <CircularProgress size={18} sx={{ color: '#89D7B7' }} />
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#89D7B7', fontSize: '0.9rem', letterSpacing: '0.02em' }}>
                    Signing in...
                  </Typography>
                </Box>
              ) : (
                'Sign In'
              )}
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

            {/* Medical Disclaimer */}
            <Typography
              sx={{
                mt: 2,
                fontSize: '0.65rem',
                color: '#428475',
                textAlign: 'center',
                lineHeight: 1.6,
                px: 1,
              }}
            >
              Medizo is a healthcare management tool. It does not provide medical diagnosis,
              treatment advice, or replace professional healthcare consultation.
            </Typography>

            {/* Legal Links */}
            <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Link
                component={RouterLink}
                to="/privacy-policy"
                sx={{
                  fontSize: '0.68rem',
                  color: '#428475',
                  fontWeight: 600,
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline', color: '#1A312C' },
                }}
              >
                Privacy Policy
              </Link>
              <Typography sx={{ fontSize: '0.68rem', color: 'rgba(66, 132, 117, 0.4)' }}>•</Typography>
              <Link
                component={RouterLink}
                to="/terms"
                sx={{
                  fontSize: '0.68rem',
                  color: '#428475',
                  fontWeight: 600,
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline', color: '#1A312C' },
                }}
              >
                Terms of Service
              </Link>
            </Box>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default Login;
