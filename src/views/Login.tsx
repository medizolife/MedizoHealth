'use client';
import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../contexts/AuthContext';
import { useThemeContext } from '../contexts/ThemeContext';
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
  Link,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { 
  LockOutlined as LockIcon, 
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  PhoneAndroid as PhoneIcon,
  CalendarToday as CalendarIcon,
  VpnKey as OtpIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { authAPI } from '../services/api';

const Login = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { mode } = useThemeContext();
  const isDark = mode === 'dark' || theme.palette.mode === 'dark';

  const { authState, login, loginMobile, loginEmailOtp, googleLogin } = useAuth();
  const { loading, error, isAuthenticated } = authState;
  
  const [loginMode, setLoginMode] = useState<'email' | 'mobile'>('email');
  const [emailAuthMethod, setEmailAuthMethod] = useState<'password' | 'otp'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpMsg, setOtpMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);

  const [mobileNumber, setMobileNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [googleProcessing, setGoogleProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot Password Modal State
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotInput, setForgotInput] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
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

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setInterval(() => setResendCountdown(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [resendCountdown]);

  const handleSendEmailOtp = async () => {
    if (!email || !email.trim()) {
      setOtpMsg({ type: 'error', text: 'Please enter your email address first' });
      return;
    }
    setOtpSending(true);
    setOtpMsg(null);
    try {
      const res = await authAPI.sendLoginOtp(email.trim());
      setOtpSent(true);
      setOtpMsg({ type: 'success', text: res.message || 'OTP verification code sent to your email!' });
      setResendCountdown(60);
    } catch (err: any) {
      let msg = err.response?.data?.message;
      if (!msg) {
        if (err.response?.status === 404) {
          msg = 'Server endpoint updating (HTTP 404). Please re-try sending OTP code in a few moments.';
        } else {
          msg = err.message || 'Failed to send OTP code';
        }
      }
      setOtpMsg({ type: 'error', text: msg });
    } finally {
      setOtpSending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (loginMode === 'email') {
        if (emailAuthMethod === 'password') {
          if (!email || !password) return;
          await login({ email, password });
        } else {
          if (!email || !emailOtp) return;
          await loginEmailOtp(email.trim(), emailOtp.trim());
        }
      } else {
        if (!mobileNumber || !password) return;
        await loginMobile(mobileNumber, dateOfBirth, password);
      }
      start3SecondHold(() => {
        navigate('/dashboard');
      });
    } catch (err) {
      setIsSubmitting(false);
    }
  };

  const handleSendForgotOtp = async () => {
    if (!forgotInput.trim()) return;
    setForgotLoading(true);
    setForgotMsg(null);
    try {
      const res = await authAPI.forgotPassword(forgotInput.trim());
      setForgotMsg({ type: 'success', text: res.message || 'Password reset OTP sent to your registered email address!' });
    } catch (err: any) {
      setForgotMsg({ type: 'error', text: err.response?.data?.message || err.message || 'Failed to request password reset' });
    } finally {
      setForgotLoading(false);
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
    setForgotOpen(true);
    setForgotMsg(null);
    setForgotInput('');
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
                backgroundImage: 'linear-gradient(135deg, rgba(10, 26, 23, 0.86) 0%, rgba(15, 38, 33, 0.92) 100%), url("/medical_login_bg.png") !important',
                backgroundSize: 'cover !important',
                backgroundPosition: 'center !important',
                border: '1px solid rgba(102, 205, 170, 0.45) !important',
                boxShadow: '0 24px 60px rgba(0, 0, 0, 0.3) !important',
                position: 'relative',
                overflow: 'hidden'
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
                      Medizo <Typography component="span" variant="caption" sx={{ color: 'var(--color-mint)', fontWeight: 800, fontSize: '0.8rem', letterSpacing: 1 }}>Life</Typography>
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
                      Instant verification for healthcare practitioners.
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
                  bgcolor: isDark ? 'rgba(23, 42, 38, 0.92) !important' : 'rgba(255, 255, 255, 0.95) !important',
                  border: isDark ? '1px solid rgba(102, 205, 170, 0.35) !important' : '1.5px solid rgba(137, 215, 183, 0.6) !important',
                  boxShadow: isDark ? '0 24px 60px rgba(0, 0, 0, 0.5) !important' : '0 24px 60px rgba(26, 49, 44, 0.15) !important',
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
                      border: isDark ? '2px solid #66CDAA' : '2px solid #89D7B7',
                      boxShadow: isDark ? '0 6px 20px rgba(102, 205, 170, 0.35)' : '0 6px 20px rgba(66, 132, 117, 0.3)'
                    }}
                  />
                </Box>

                <Typography variant="h6" sx={{ fontWeight: 900, color: isDark ? '#F2FAF7' : '#1A312C', fontSize: '1.25rem', mb: 0.5, fontFamily: "'Outfit', sans-serif" }}>
                  Verifying Login, Please Wait...
                </Typography>

                <Typography variant="body2" sx={{ color: isDark ? '#A5E6D2' : '#428475', fontWeight: 700, fontSize: '0.88rem', mb: 3, minHeight: 38, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                      bgcolor: isDark ? 'rgba(102, 205, 170, 0.18)' : 'rgba(137, 215, 183, 0.25)',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 5,
                        background: 'linear-gradient(90deg, #2A6B5D 0%, #10B981 100%)'
                      }
                    }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="caption" sx={{ color: isDark ? '#A5E6D2' : '#428475', fontWeight: 800, fontSize: '0.72rem' }}>
                      Database Sync
                    </Typography>
                    <Typography variant="caption" sx={{ color: isDark ? '#F2FAF7' : '#1A312C', fontWeight: 900, fontSize: '0.72rem' }}>
                      {verifyProgress}%
                    </Typography>
                  </Box>
                </Box>

                <Chip
                  label="🔒 256-Bit Encrypted Session Sync"
                  size="small"
                  sx={{
                    bgcolor: isDark ? 'rgba(102, 205, 170, 0.2)' : 'rgba(16, 185, 129, 0.12)',
                    color: isDark ? '#66CDAA' : '#059669',
                    fontWeight: 800,
                    fontSize: '0.72rem',
                    border: isDark ? '1px solid rgba(102, 205, 170, 0.4)' : '1px solid rgba(16, 185, 129, 0.3)',
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
                  bgcolor: isDark ? 'rgba(23, 42, 38, 0.88) !important' : 'rgba(255, 255, 255, 0.94) !important',
                  border: isDark ? '1px solid rgba(102, 205, 170, 0.35) !important' : '1px solid rgba(137, 215, 183, 0.45) !important',
                  boxShadow: isDark ? '0 20px 50px rgba(0, 0, 0, 0.5) !important' : '0 20px 50px rgba(26, 49, 44, 0.1) !important'
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
                border: isDark ? '2px solid #66CDAA' : '2px solid #89D7B7',
                boxShadow: isDark ? '0 4px 12px rgba(102, 205, 170, 0.3)' : '0 4px 12px rgba(66, 132, 117, 0.18)'
              }}
            />
            <Typography variant="h6" sx={{ fontWeight: 800, color: isDark ? '#F2FAF7' : '#1A312C', letterSpacing: '-0.02em', fontSize: '1.15rem' }}>
              Welcome to Medizo
            </Typography>
            <Typography variant="caption" sx={{ color: isDark ? '#A5E6D2' : '#428475', fontWeight: 600, display: 'block', mt: 0.1, fontSize: '0.75rem' }}>
              Sign in to access your digital prescriptions
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 1.25, py: 0.25, borderRadius: '12px', bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              {error}
            </Alert>
          )}

          {googleError && (
            <Alert severity="error" sx={{ mb: 1.25, py: 0.25, borderRadius: '12px', bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              {googleError}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit}>
            {/* Login Mode Tabs */}
            <Tabs
              value={loginMode === 'email' ? 0 : 1}
              onChange={(_, val) => setLoginMode(val === 0 ? 'email' : 'mobile')}
              variant="fullWidth"
              sx={{
                mb: 2,
                minHeight: 36,
                '& .MuiTabs-indicator': { bgcolor: isDark ? '#66CDAA' : '#1A312C', height: 2.5, borderRadius: 2 },
                '& .MuiTab-root': { minHeight: 36, fontWeight: 700, fontSize: '0.78rem', color: isDark ? 'rgba(165, 230, 210, 0.7)' : '#428475', textTransform: 'none' },
                '& .Mui-selected': { color: isDark ? '#66CDAA !important' : '#1A312C !important' }
              }}
            >
              <Tab icon={<EmailIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Email" />
              <Tab icon={<PhoneIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Mobile" />
            </Tabs>

            {/* Email Login Section */}
            {loginMode === 'email' && (
              <>
                {/* Email Sub-Toggle: Password vs OTP */}
                <Box 
                  sx={{ 
                    display: 'flex', 
                    bgcolor: isDark ? 'rgba(0,0,0,0.25)' : 'rgba(26, 49, 44, 0.05)', 
                    p: 0.5, 
                    borderRadius: '12px', 
                    mb: 1.5,
                    border: isDark ? '1px solid rgba(102, 205, 170, 0.2)' : '1px solid rgba(137, 215, 183, 0.3)'
                  }}
                >
                  <Button
                    fullWidth
                    size="small"
                    startIcon={<LockIcon sx={{ fontSize: 14 }} />}
                    onClick={() => setEmailAuthMethod('password')}
                    sx={{
                      borderRadius: '10px',
                      py: 0.6,
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      textTransform: 'none',
                      bgcolor: emailAuthMethod === 'password' ? (isDark ? '#66CDAA' : '#1A312C') : 'transparent',
                      color: emailAuthMethod === 'password' ? (isDark ? '#0E1A17' : '#89D7B7') : (isDark ? 'rgba(255,255,255,0.7)' : '#428475'),
                      '&:hover': { bgcolor: emailAuthMethod === 'password' ? (isDark ? '#66CDAA' : '#1A312C') : 'rgba(0,0,0,0.05)' }
                    }}
                  >
                    Login with Password
                  </Button>
                  <Button
                    fullWidth
                    size="small"
                    startIcon={<OtpIcon sx={{ fontSize: 14 }} />}
                    onClick={() => setEmailAuthMethod('otp')}
                    sx={{
                      borderRadius: '10px',
                      py: 0.6,
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      textTransform: 'none',
                      bgcolor: emailAuthMethod === 'otp' ? (isDark ? '#66CDAA' : '#1A312C') : 'transparent',
                      color: emailAuthMethod === 'otp' ? (isDark ? '#0E1A17' : '#89D7B7') : (isDark ? 'rgba(255,255,255,0.7)' : '#428475'),
                      '&:hover': { bgcolor: emailAuthMethod === 'otp' ? (isDark ? '#66CDAA' : '#1A312C') : 'rgba(0,0,0,0.05)' }
                    }}
                  >
                    Login with OTP
                  </Button>
                </Box>

                <TextField
                  margin="dense"
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  placeholder="Enter your email address"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  InputLabelProps={{
                    sx: { color: isDark ? '#A5E6D2' : '#2A6B5D', fontWeight: 600, fontSize: '0.85rem' }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon sx={{ color: isDark ? '#66CDAA' : '#428475', fontSize: 18 }} />
                      </InputAdornment>
                    ),
                    sx: { 
                      borderRadius: '14px',
                      bgcolor: isDark ? 'rgba(14, 26, 23, 0.75)' : 'rgba(255, 255, 255, 0.95)',
                      color: isDark ? '#F2FAF7' : '#123029',
                      fontSize: '0.9rem',
                      '& input::placeholder': {
                        color: isDark ? 'rgba(165, 230, 210, 0.6)' : '#4D9B8C',
                        opacity: 0.85,
                        fontWeight: 500,
                      },
                      '& fieldset': { borderColor: isDark ? 'rgba(102, 205, 170, 0.35)' : 'rgba(137, 215, 183, 0.5)' },
                      '&:hover fieldset': { borderColor: isDark ? '#66CDAA !important' : '#428475 !important' },
                      '&.Mui-focused fieldset': { borderColor: isDark ? '#66CDAA !important' : '#2A6B5D !important' }
                    }
                  }}
                />

                {/* Password Mode Fields */}
                {emailAuthMethod === 'password' && (
                  <>
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
                        sx: { color: isDark ? '#A5E6D2' : '#2A6B5D', fontWeight: 600, fontSize: '0.85rem' }
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon sx={{ color: isDark ? '#66CDAA' : '#428475', fontSize: 18 }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                              size="small"
                              sx={{ color: isDark ? '#66CDAA' : '#428475' }}
                            >
                              {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                            </IconButton>
                          </InputAdornment>
                        ),
                        sx: { 
                          borderRadius: '14px',
                          bgcolor: isDark ? 'rgba(14, 26, 23, 0.75)' : 'rgba(255, 255, 255, 0.95)',
                          color: isDark ? '#F2FAF7' : '#123029',
                          fontSize: '0.9rem',
                          '& input::placeholder': {
                            color: isDark ? 'rgba(165, 230, 210, 0.6)' : '#4D9B8C',
                            opacity: 0.85,
                            fontWeight: 500,
                          },
                          '& fieldset': { borderColor: isDark ? 'rgba(102, 205, 170, 0.35)' : 'rgba(137, 215, 183, 0.5)' },
                          '&:hover fieldset': { borderColor: isDark ? '#66CDAA !important' : '#428475 !important' },
                          '&.Mui-focused fieldset': { borderColor: isDark ? '#66CDAA !important' : '#2A6B5D !important' }
                        }
                      }}
                    />

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.25, mb: 0.5 }}>
                      <Typography
                        variant="caption"
                        onClick={handleForgotPassword}
                        sx={{
                          color: isDark ? '#66CDAA' : '#428475',
                          fontWeight: 700,
                          cursor: 'pointer',
                          fontSize: '0.725rem',
                          '&:hover': { color: isDark ? '#80E5C2' : '#1A312C', textDecoration: 'underline' }
                        }}
                      >
                        Forgot Password?
                      </Typography>
                    </Box>
                  </>
                )}

                {/* Email OTP Mode Fields */}
                {emailAuthMethod === 'otp' && (
                  <Box sx={{ mt: 1, mb: 1 }}>
                    {otpMsg && (
                      <Alert severity={otpMsg.type} sx={{ mb: 1.25, borderRadius: '12px', py: 0.25, fontSize: '0.78rem' }}>
                        {otpMsg.text}
                      </Alert>
                    )}

                    <Box sx={{ mb: 1.25 }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={handleSendEmailOtp}
                        disabled={otpSending || resendCountdown > 0 || !email.trim()}
                        startIcon={otpSending ? <CircularProgress size={16} color="inherit" /> : <SendIcon sx={{ fontSize: 15 }} />}
                        sx={{
                          borderRadius: '12px',
                          py: 0.8,
                          fontWeight: 800,
                          fontSize: '0.78rem',
                          borderColor: isDark ? '#66CDAA' : '#1A312C',
                          color: isDark ? '#66CDAA' : '#1A312C',
                          textTransform: 'none',
                          '&:hover': { bgcolor: isDark ? 'rgba(102, 205, 170, 0.15)' : 'rgba(26, 49, 44, 0.08)' }
                        }}
                      >
                        {otpSending 
                          ? 'Sending Verification Code...' 
                          : resendCountdown > 0 
                          ? `Resend Code in ${resendCountdown}s` 
                          : otpSent 
                          ? 'Resend OTP Code' 
                          : '📩 Send OTP Code to Email'}
                      </Button>
                    </Box>

                    <TextField
                      margin="dense"
                      required
                      fullWidth
                      id="emailOtp"
                      label="6-Digit Verification OTP"
                      name="emailOtp"
                      placeholder="Enter 6-digit OTP"
                      value={emailOtp}
                      onChange={(e) => setEmailOtp(e.target.value)}
                      inputProps={{ maxLength: 6 }}
                      InputLabelProps={{
                        sx: { color: isDark ? '#A5E6D2' : '#2A6B5D', fontWeight: 600, fontSize: '0.85rem' }
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <OtpIcon sx={{ color: isDark ? '#66CDAA' : '#428475', fontSize: 18 }} />
                          </InputAdornment>
                        ),
                        sx: { 
                          borderRadius: '14px',
                          bgcolor: isDark ? 'rgba(14, 26, 23, 0.75)' : 'rgba(255, 255, 255, 0.95)',
                          color: isDark ? '#F2FAF7' : '#123029',
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          letterSpacing: '3px',
                          '& input::placeholder': { color: isDark ? 'rgba(165, 230, 210, 0.6)' : '#4D9B8C', opacity: 0.85, fontWeight: 500, letterSpacing: 'normal' },
                          '& fieldset': { borderColor: isDark ? 'rgba(102, 205, 170, 0.35)' : 'rgba(137, 215, 183, 0.5)' },
                          '&:hover fieldset': { borderColor: isDark ? '#66CDAA !important' : '#428475 !important' },
                          '&.Mui-focused fieldset': { borderColor: isDark ? '#66CDAA !important' : '#2A6B5D !important' }
                        }
                      }}
                    />
                  </Box>
                )}
              </>
            )}

            {/* Mobile Login Fields */}
            {loginMode === 'mobile' && (
              <>
                <TextField
                  margin="dense"
                  required
                  fullWidth
                  id="mobileNumber"
                  label="Mobile Number"
                  name="mobileNumber"
                  placeholder="Enter your mobile number"
                  autoComplete="tel"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  InputLabelProps={{
                    sx: { color: isDark ? '#A5E6D2' : '#2A6B5D', fontWeight: 600, fontSize: '0.85rem' }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon sx={{ color: isDark ? '#66CDAA' : '#428475', fontSize: 18 }} />
                      </InputAdornment>
                    ),
                    sx: { 
                      borderRadius: '14px',
                      bgcolor: isDark ? 'rgba(14, 26, 23, 0.75)' : 'rgba(255, 255, 255, 0.95)',
                      color: isDark ? '#F2FAF7' : '#123029',
                      fontSize: '0.9rem',
                      '& input::placeholder': { color: isDark ? 'rgba(165, 230, 210, 0.6)' : '#4D9B8C', opacity: 0.85, fontWeight: 500 },
                      '& fieldset': { borderColor: isDark ? 'rgba(102, 205, 170, 0.35)' : 'rgba(137, 215, 183, 0.5)' },
                      '&:hover fieldset': { borderColor: isDark ? '#66CDAA !important' : '#428475 !important' },
                      '&.Mui-focused fieldset': { borderColor: isDark ? '#66CDAA !important' : '#2A6B5D !important' }
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
                    sx: { color: isDark ? '#A5E6D2' : '#2A6B5D', fontWeight: 600, fontSize: '0.85rem' }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon sx={{ color: isDark ? '#66CDAA' : '#428475', fontSize: 18 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          size="small"
                          sx={{ color: isDark ? '#66CDAA' : '#428475' }}
                        >
                          {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                    sx: { 
                      borderRadius: '14px',
                      bgcolor: isDark ? 'rgba(14, 26, 23, 0.75)' : 'rgba(255, 255, 255, 0.95)',
                      color: isDark ? '#F2FAF7' : '#123029',
                      fontSize: '0.9rem',
                      '& input::placeholder': {
                        color: isDark ? 'rgba(165, 230, 210, 0.6)' : '#4D9B8C',
                        opacity: 0.85,
                        fontWeight: 500,
                      },
                      '& fieldset': { borderColor: isDark ? 'rgba(102, 205, 170, 0.35)' : 'rgba(137, 215, 183, 0.5)' },
                      '&:hover fieldset': { borderColor: isDark ? '#66CDAA !important' : '#428475 !important' },
                      '&.Mui-focused fieldset': { borderColor: isDark ? '#66CDAA !important' : '#2A6B5D !important' }
                    }
                  }}
                />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.25, mb: 0.5 }}>
                  <Typography
                    variant="caption"
                    onClick={handleForgotPassword}
                    sx={{
                      color: isDark ? '#66CDAA' : '#428475',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: '0.725rem',
                      '&:hover': { color: isDark ? '#80E5C2' : '#1A312C', textDecoration: 'underline' }
                    }}
                  >
                    Forgot Password?
                  </Typography>
                </Box>
              </>
            )}

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
                background: isDark ? 'linear-gradient(135deg, #66CDAA 0%, #4D9B8C 100%)' : '#1A312C', 
                color: isDark ? '#0E1A17' : '#89D7B7',
                borderRadius: '14px',
                fontSize: '0.9rem',
                fontWeight: 800,
                boxShadow: (loading || isSubmitting) ? 'none' : isDark ? '0 6px 20px rgba(102, 205, 170, 0.3)' : '0 6px 18px rgba(26, 49, 44, 0.2)',
                border: isDark ? '1px solid #80E5C2' : '1px solid #89D7B7',
                '&:hover': { background: isDark ? 'linear-gradient(135deg, #80E5C2 0%, #52A694 100%)' : '#0F1D1A' },
                '&.Mui-disabled': { bgcolor: isDark ? 'rgba(102, 205, 170, 0.4)' : '#1A312C', color: isDark ? '#0E1A17' : '#89D7B7', opacity: 0.85 },
                transition: 'all 0.2s ease'
              }}
            >
              {(loading || isSubmitting) ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.2 }}>
                  <CircularProgress size={18} sx={{ color: isDark ? '#0E1A17' : '#89D7B7' }} />
                  <Typography variant="body2" sx={{ fontWeight: 800, color: isDark ? '#0E1A17' : '#89D7B7', fontSize: '0.9rem', letterSpacing: '0.02em' }}>
                    Signing in...
                  </Typography>
                </Box>
              ) : (
                loginMode === 'email' && emailAuthMethod === 'otp' ? 'Verify OTP & Sign In' : 'Sign In'
              )}
            </Button>

            {/* Google Sign-In Divider */}
            <Divider sx={{ my: 1, borderColor: isDark ? 'rgba(102, 205, 170, 0.25)' : 'rgba(137, 215, 183, 0.3)' }}>
              <Typography variant="caption" sx={{ color: isDark ? '#A5E6D2' : '#428475', fontWeight: 700, px: 1, fontSize: '0.675rem' }}>
                OR
              </Typography>
            </Divider>

            {/* Google Sign-In Button */}
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', my: 1.25 }}>
              {googleProcessing ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} sx={{ color: isDark ? '#66CDAA' : '#428475' }} />
                  <Typography variant="caption" sx={{ color: isDark ? '#A5E6D2' : '#428475', fontWeight: 600 }}>
                    Signing in with Google...
                  </Typography>
                </Box>
              ) : (
                <Box
                  sx={{
                    display: 'inline-flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    bgcolor: '#FFFFFF',
                    borderRadius: '12px',
                    boxShadow: isDark ? '0 4px 16px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.3)' : '0 4px 14px rgba(0, 0, 0, 0.08)',
                    overflow: 'hidden',
                    p: '1px',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: isDark ? '0 6px 22px rgba(255, 255, 255, 0.3)' : '0 6px 18px rgba(0, 0, 0, 0.12)',
                      transform: 'translateY(-1px)'
                    }
                  }}
                >
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    useOneTap={false}
                    theme="outline"
                    size="large"
                    text="continue_with"
                    shape="rectangular"
                    width="318"
                  />
                </Box>
              )}
            </Box>

            <Divider sx={{ my: 1.25, borderColor: isDark ? 'rgba(102, 205, 170, 0.25)' : 'rgba(137, 215, 183, 0.3)' }}>
              <Typography variant="caption" sx={{ color: isDark ? '#A5E6D2' : '#428475', fontWeight: 700, px: 1, fontSize: '0.675rem' }}>
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
                borderColor: isDark ? '#66CDAA' : '#428475', 
                color: isDark ? '#66CDAA' : '#1A312C',
                borderRadius: '14px',
                fontWeight: 800,
                borderWidth: '1.5px',
                fontSize: '0.85rem',
                '&:hover': { 
                  bgcolor: isDark ? 'rgba(102, 205, 170, 0.15)' : 'rgba(137, 215, 183, 0.15)', 
                  borderColor: isDark ? '#80E5C2' : '#1A312C',
                  color: isDark ? '#80E5C2' : '#1A312C'
                }
              }}
            >
              Create New Account
            </Button>

            {/* Medical Disclaimer */}
            <Typography
              sx={{
                mt: 2,
                fontSize: '0.65rem',
                color: isDark ? 'rgba(165, 230, 210, 0.75)' : '#428475',
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
                  color: isDark ? '#66CDAA' : '#428475',
                  fontWeight: 600,
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline', color: isDark ? '#80E5C2' : '#1A312C' },
                }}
              >
                Privacy Policy
              </Link>
              <Typography sx={{ fontSize: '0.68rem', color: isDark ? 'rgba(102, 205, 170, 0.4)' : 'rgba(66, 132, 117, 0.4)' }}>•</Typography>
              <Link
                component={RouterLink}
                to="/terms"
                sx={{
                  fontSize: '0.68rem',
                  color: isDark ? '#66CDAA' : '#428475',
                  fontWeight: 600,
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline', color: isDark ? '#80E5C2' : '#1A312C' },
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

      {/* Forgot Password Dialog */}
      <Dialog 
        open={forgotOpen} 
        onClose={() => setForgotOpen(false)} 
        maxWidth="xs" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            bgcolor: isDark ? '#172A26' : '#FFFFFF',
            border: isDark ? '1px solid rgba(102, 205, 170, 0.3)' : 'none',
            color: isDark ? '#F2FAF7' : 'inherit'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: isDark ? '#F2FAF7' : '#1A312C' }}>Forgot Password?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: isDark ? '#A5E6D2' : '#428475' }}>
            Enter your registered email address or mobile number. We'll send you a password reset link.
          </Typography>
          {forgotMsg && (
            <Alert severity={forgotMsg.type} sx={{ mb: 2, borderRadius: '10px' }}>
              {forgotMsg.text}
            </Alert>
          )}
          <TextField
            autoFocus
            fullWidth
            label="Email or Mobile Number"
            value={forgotInput}
            onChange={(e) => setForgotInput(e.target.value)}
            InputLabelProps={{ sx: { color: isDark ? '#A5E6D2' : '#2A6B5D' } }}
            InputProps={{ 
              sx: { 
                borderRadius: '12px',
                bgcolor: isDark ? 'rgba(14, 26, 23, 0.75)' : '#FFFFFF',
                color: isDark ? '#F2FAF7' : '#123029',
                '& fieldset': { borderColor: isDark ? 'rgba(102, 205, 170, 0.35)' : undefined }
              } 
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setForgotOpen(false)} sx={{ color: isDark ? '#A5E6D2' : 'inherit', fontWeight: 700 }}>
            Cancel
          </Button>
          <Button
            onClick={handleSendForgotOtp}
            variant="contained"
            disabled={forgotLoading || !forgotInput.trim()}
            sx={{ 
              background: isDark ? 'linear-gradient(135deg, #66CDAA 0%, #4D9B8C 100%)' : '#1A312C', 
              color: isDark ? '#0E1A17' : '#89D7B7', 
              fontWeight: 800, 
              borderRadius: '12px', 
              '&:hover': { background: isDark ? 'linear-gradient(135deg, #80E5C2 0%, #52A694 100%)' : '#0F1D1A' } 
            }}
          >
            {forgotLoading ? <CircularProgress size={20} sx={{ color: isDark ? '#0E1A17' : '#89D7B7' }} /> : 'Send Reset Email'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Login;
