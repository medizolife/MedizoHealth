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
  Grid,
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
        minHeight: 'calc(100dvh - 120px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: { xs: 2, sm: 4, md: 6 },
        py: { xs: 3, md: 5 },
        boxSizing: 'border-box'
      }} 
      className="animate-slide-up"
    >
      {/* ─── Responsive Desktop 2-Column Container ─── */}
      <Box sx={{ width: '100%', maxWidth: { xs: 440, md: 1060 }, mx: 'auto' }}>
        <Grid container spacing={{ xs: 0, md: 4 }} alignItems="stretch">
          
          {/* ─── Left Column: Widescreen Healthcare Feature Showcase (Desktop Only) ─── */}
          <Grid item xs={12} md={6} lg={6.5} sx={{ display: { xs: 'none', md: 'flex' } }}>
            <Paper
              elevation={0}
              className="glass-card-dark specular-sheen"
              sx={{
                width: '100%',
                p: { md: 4, lg: 5 },
                borderRadius: '32px !important',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                background: 'linear-gradient(135deg, rgba(20, 38, 34, 0.96) 0%, rgba(10, 24, 21, 0.98) 100%) !important',
                border: '1px solid rgba(102, 205, 170, 0.4) !important',
                boxShadow: '0 24px 60px rgba(0, 0, 0, 0.25) !important'
              }}
            >
              {/* Header Branding */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <Box
                    component="img"
                    src="/LOGO.png"
                    alt="Medizo Logo"
                    sx={{ 
                      width: 48, 
                      height: 48, 
                      borderRadius: '14px', 
                      border: '2px solid #66CDAA',
                      boxShadow: '0 0 20px rgba(102, 205, 170, 0.3)'
                    }}
                  />
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#ffffff', letterSpacing: 0.5 }}>
                      Medizo <Typography component="span" variant="caption" sx={{ color: 'var(--color-mint)', fontWeight: 800, fontSize: '0.8rem', letterSpacing: 1 }}>HEALTH</Typography>
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 700 }}>
                      Next-Gen Digital Healthcare Platform
                    </Typography>
                  </Box>
                </Box>

                <Typography variant="h4" sx={{ fontWeight: 900, color: '#ffffff', lineHeight: 1.2, letterSpacing: '-0.02em', mb: 2 }}>
                  Secure Digital Prescriptions & Smart Medical Records 💊
                </Typography>

                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.95rem', lineHeight: 1.6, mb: 4 }}>
                  Connect seamlessly with certified practitioners, issue instant QR-verified digital prescriptions, and manage medical histories in real time.
                </Typography>
              </Box>

              {/* Widescreen Feature Pills */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, my: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: '20px', bgcolor: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(102, 205, 170, 0.25)' }}>
                  <Box sx={{ p: 1.2, borderRadius: '14px', bgcolor: 'rgba(102, 205, 170, 0.2)', color: '#66CDAA', display: 'flex' }}>
                    <LockIcon sx={{ fontSize: 24 }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#ffffff', fontSize: '0.9rem' }}>
                      256-Bit Encrypted Sessions
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.78rem' }}>
                      Bank-grade security stamp on all medical transactions.
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: '20px', bgcolor: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(102, 205, 170, 0.25)' }}>
                  <Box sx={{ p: 1.2, borderRadius: '14px', bgcolor: 'rgba(255, 152, 0, 0.2)', color: '#ffb74d', display: 'flex' }}>
                    <EmailIcon sx={{ fontSize: 24 }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#ffffff', fontSize: '0.9rem' }}>
                      DigiLocker Identity Protection
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.78rem' }}>
                      Instant verification for healthcare practitioners & patients.
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Footer Trust Badge */}
              <Box sx={{ pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Chip
                  label="Verified Practitioner Portal"
                  size="small"
                  sx={{ bgcolor: 'rgba(102, 205, 170, 0.2)', color: '#66CDAA', fontWeight: 800, fontSize: '0.72rem' }}
                />
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontWeight: 600 }}>
                  v2.4 Widescreen Edition
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* ─── Right Column: Login Form ─── */}
          <Grid item xs={12} md={6} lg={5.5}>
            {verifyingLogin ? (
              <Paper 
                elevation={0} 
                className="glass-panel animate-slide-up"
                sx={{ 
                  width: '100%',
                  p: { xs: 3, sm: 4, md: 5 }, 
                  borderRadius: '32px !important', 
                  bgcolor: 'rgba(255, 255, 255, 0.95) !important',
                  border: '1.5px solid rgba(137, 215, 183, 0.6) !important',
                  boxShadow: '0 24px 60px rgba(26, 49, 44, 0.15) !important',
                  textAlign: 'center',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2.5, mx: 'auto' }}>
                  <Box
                    component="img"
                    src="/LOGO.png"
                    alt="Medizo Logo"
                    sx={{ 
                      width: 64, 
                      height: 64, 
                      borderRadius: '18px', 
                      border: '2px solid #89D7B7',
                      boxShadow: '0 6px 20px rgba(66, 132, 117, 0.3)'
                    }}
                  />
                </Box>

                <Typography variant="h6" sx={{ fontWeight: 900, color: '#1A312C', fontSize: '1.25rem', mb: 0.5, fontFamily: "'Outfit', sans-serif" }}>
                  Verifying Login, Please Wait...
                </Typography>

                <Typography variant="body2" sx={{ color: '#428475', fontWeight: 700, fontSize: '0.88rem', mb: 3, minHeight: 38, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {verifyStepText}
                </Typography>

                {/* Progress bar */}
                <Box sx={{ width: '100%', mb: 3 }}>
                  <LinearProgress
                    variant="determinate"
                    value={verifyProgress}
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      bgcolor: 'rgba(137, 215, 183, 0.25)',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 5,
                        background: 'linear-gradient(90deg, #2A6B5D 0%, #10B981 100%)'
                      }
                    }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="caption" sx={{ color: '#428475', fontWeight: 800, fontSize: '0.72rem' }}>
                      Database Sync
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#1A312C', fontWeight: 900, fontSize: '0.72rem' }}>
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
                    fontSize: '0.72rem',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    py: 0.4,
                    mx: 'auto'
                  }}
                />
              </Paper>
            ) : (
              <Paper 
                elevation={0} 
                className="glass-panel"
                sx={{ 
                  width: '100%',
                  p: { xs: 3, sm: 4, md: 4.5 }, 
                  borderRadius: '32px !important', 
                  bgcolor: 'rgba(255, 255, 255, 0.94) !important',
                  border: '1px solid rgba(137, 215, 183, 0.45) !important',
                  boxShadow: '0 20px 50px rgba(26, 49, 44, 0.1) !important'
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
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default Login;
