'use client';
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../contexts/AuthContext';
import { useThemeContext } from '../contexts/ThemeContext';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  MenuItem,
  Button, 
  Alert, 
  CircularProgress, 
  Container, 
  Grid,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  Link
} from '@mui/material';
import { 
  Visibility,
  VisibilityOff,
  Google as GoogleIcon
} from '@mui/icons-material';

interface GoogleData {
  firstName: string;
  lastName: string;
  email: string;
  token: string;
  user: any;
}

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { mode } = useThemeContext();
  const isDark = mode === 'dark' || theme.palette.mode === 'dark';

  const { authState, register, googleLogin, googleCompleteRegistration } = useAuth();
  const { loading, error, isAuthenticated } = authState;
  
  // Check if we arrived with pre-filled email from login or Google sign-in
  const googleData: GoogleData | null = (location.state as any)?.googleData || null;
  const prefilledEmail: string = (location.state as any)?.prefilledEmail || '';
  const isGoogleSignUp = !!googleData;
  
  const [formData, setFormData] = useState({
    firstName: googleData?.firstName || '',
    lastName: googleData?.lastName || '',
    email: googleData?.email || prefilledEmail || '',
    password: '',
    confirmPassword: '',
    role: '' as 'doctor' | 'patient' | 'pharmacist' | ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [roleError, setRoleError] = useState('');
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [googleProcessing, setGoogleProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [highlightGoogle, setHighlightGoogle] = useState(false);
  
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (e.target.name === 'password' || e.target.name === 'confirmPassword') {
      setPasswordError('');
    }
    if (e.target.name === 'role') {
      setRoleError('');
      if (e.target.value) {
        setHighlightGoogle(true);
        setTimeout(() => {
          setHighlightGoogle(false);
        }, 4000);
      }
    }
  };
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setRoleError('');
    setPasswordError('');
    
    const { firstName, lastName, email, password, confirmPassword, role } = formData;

    if (!role) {
      setRoleError('Please select your role (Patient, Doctor, or Pharmacist)');
      return;
    }

    if (!isGoogleSignUp) {
      if (password !== confirmPassword) {
        setPasswordError('Passwords do not match');
        return;
      }

      if (!password || password.length < 4) {
        setPasswordError('Password must be at least 4 characters');
        return;
      }
    }

    setIsSubmitting(true);
    
    try {
      if (isGoogleSignUp && googleData) {
        googleCompleteRegistration(googleData.token, googleData.user);
        navigate('/dashboard');
        return;
      }

      await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: role as 'doctor' | 'patient' | 'pharmacist'
      });
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setGoogleError(null);
    setRoleError('');

    if (!formData.role) {
      setRoleError('Please select your role (Patient, Doctor, or Pharmacist) before signing up with Google');
      return;
    }

    setGoogleProcessing(true);
    
    try {
      const result = await googleLogin(credentialResponse.credential, formData.role);
      
      if (result && result.user && result.token) {
        navigate('/dashboard');
      } else if (result && result.isNewUser && result.user) {
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error('Google sign-up error:', err);
      setGoogleError(err.response?.data?.message || 'Failed to sign up with Google');
    } finally {
      setGoogleProcessing(false);
    }
  };

  const handleGoogleError = () => {
    setGoogleError('Google sign-in was cancelled or failed. Please try again.');
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
      <Box sx={{ width: '100%', maxWidth: { xs: 460, md: 1060 }, mx: 'auto' }}>
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
                  Join Thousands of Doctors & Patients on Medizo 🩺
                </Typography>

                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.95rem', lineHeight: 1.6, mb: 4 }}>
                  Create your practitioner or patient account to manage digital prescriptions, schedule follow-ups, and store medical records securely.
                </Typography>
              </Box>

              {/* Widescreen Feature Pills */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, my: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: '20px', bgcolor: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(102, 205, 170, 0.25)' }}>
                  <Box sx={{ p: 1.2, borderRadius: '14px', bgcolor: 'rgba(102, 205, 170, 0.2)', color: '#66CDAA', display: 'flex' }}>
                    <GoogleIcon sx={{ fontSize: 24 }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#ffffff', fontSize: '0.9rem' }}>
                      One-Tap Google Registration
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.78rem' }}>
                      Sign up instantly with your Google Account.
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: '20px', bgcolor: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(102, 205, 170, 0.25)' }}>
                  <Box sx={{ p: 1.2, borderRadius: '14px', bgcolor: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', display: 'flex' }}>
                    <Typography sx={{ fontWeight: 900, fontSize: '1.1rem' }}>👨‍⚕️</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#ffffff', fontSize: '0.9rem' }}>
                      Role-Based Access Control
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.78rem' }}>
                      Dedicated interfaces tailored for Doctors & Patients.
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Footer Trust Badge */}
              <Box sx={{ pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Chip
                  label="HIPAA & DigiLocker Ready"
                  size="small"
                  sx={{ bgcolor: 'rgba(102, 205, 170, 0.2)', color: '#66CDAA', fontWeight: 800, fontSize: '0.72rem' }}
                />
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontWeight: 600 }}>
                  Fast & Secure Onboarding
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* ─── Right Column: Registration Form ─── */}
          <Grid item xs={12} md={6} lg={5.5}>
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
        <Box sx={{ textAlign: 'center', mb: 2.5 }}>
          <Box
            component="img"
            src="/LOGO.png"
            alt="Medizo Logo"
            sx={{ 
              width: 52, 
              height: 52, 
              borderRadius: '14px', 
              mb: 1.5,
              border: isDark ? '2px solid #66CDAA' : '2px solid #89D7B7',
              boxShadow: isDark ? '0 4px 16px rgba(102, 205, 170, 0.35)' : '0 4px 16px rgba(66, 132, 117, 0.2)'
            }}
          />
          <Typography variant="h5" sx={{ fontWeight: 800, color: isDark ? '#F2FAF7' : '#1A312C', letterSpacing: '-0.02em' }}>
            {isGoogleSignUp ? 'Complete Registration' : 'Create Account'}
          </Typography>
          <Typography variant="body2" sx={{ color: isDark ? '#A5E6D2' : '#428475', fontWeight: 600, mt: 0.5 }}>
            {isGoogleSignUp 
              ? 'Select your role to complete registration' 
              : 'Join Medizo Healthcare Platform'}
          </Typography>
        </Box>

        {/* Google info banner when signing up with Google */}
        {isGoogleSignUp && (
          <Alert 
            severity="info" 
            icon={<GoogleIcon sx={{ color: isDark ? '#66CDAA' : '#428475' }} />}
            sx={{ 
              mb: 2, 
              borderRadius: '14px', 
              bgcolor: isDark ? 'rgba(102, 205, 170, 0.15)' : 'rgba(137, 215, 183, 0.12)', 
              color: isDark ? '#F2FAF7' : '#1A312C', 
              border: isDark ? '1px solid rgba(102, 205, 170, 0.35)' : '1px solid rgba(137, 215, 183, 0.3)',
              '& .MuiAlert-icon': { color: isDark ? '#66CDAA' : '#428475' }
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Signed in as {googleData?.email}
            </Typography>
            <Typography variant="caption" sx={{ color: isDark ? '#A5E6D2' : '#428475' }}>
              Please select your role below to complete registration
            </Typography>
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: '14px', bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            {error}
          </Alert>
        )}

        {googleError && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: '14px', bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            {googleError}
          </Alert>
        )}

        {/* Step 1: Mandatory Role Selection at the top */}
        <Box sx={{ mb: 2.5 }}>
          <TextField
            select
            required
            fullWidth
            id="role"
            name="role"
            label="Register As (Select Role) *"
            value={formData.role}
            onChange={handleChange}
            error={!!roleError}
            helperText={roleError || 'Select whether you are registering as a Patient, Doctor, or Pharmacist'}
            FormHelperTextProps={{
              sx: { color: roleError ? '#ef4444' : isDark ? '#A5E6D2' : '#428475' }
            }}
            InputLabelProps={{ shrink: true, sx: { color: isDark ? '#A5E6D2' : '#2A6B5D', fontWeight: 700 } }}
            SelectProps={{
              displayEmpty: true,
              MenuProps: {
                PaperProps: {
                  sx: {
                    bgcolor: isDark ? '#172A26' : '#FFFFFF',
                    color: isDark ? '#F2FAF7' : '#123029',
                    border: isDark ? '1px solid rgba(102, 205, 170, 0.3)' : 'none',
                    borderRadius: '14px'
                  }
                }
              }
            }}
            InputProps={{ 
              sx: { 
                borderRadius: '14px',
                bgcolor: isDark ? 'rgba(14, 26, 23, 0.75)' : 'rgba(255, 255, 255, 0.95)',
                color: isDark ? '#F2FAF7' : '#123029',
                fontWeight: 700,
                '& .MuiSelect-icon': { color: isDark ? '#66CDAA' : '#428475' },
                '& fieldset': { borderColor: roleError ? '#ef4444' : isDark ? 'rgba(102, 205, 170, 0.35)' : 'rgba(137, 215, 183, 0.6)' },
                '&:hover fieldset': { borderColor: isDark ? '#66CDAA !important' : '#428475 !important' },
                '&.Mui-focused fieldset': { borderColor: isDark ? '#66CDAA !important' : '#2A6B5D !important' }
              } 
            }}
          >
            <MenuItem value="" disabled sx={{ color: isDark ? 'rgba(165, 230, 210, 0.5)' : '#888', fontStyle: 'italic' }}>
              -- Select Role --
            </MenuItem>
            <MenuItem value="patient" sx={{ fontWeight: 600, py: 1.2, color: isDark ? '#F2FAF7' : 'inherit' }}>
              Patient
            </MenuItem>
            <MenuItem value="doctor" sx={{ fontWeight: 600, py: 1.2, color: isDark ? '#F2FAF7' : 'inherit' }}>
              Doctor
            </MenuItem>
            <MenuItem value="pharmacist" sx={{ fontWeight: 600, py: 1.2, color: isDark ? '#F2FAF7' : 'inherit' }}>
              Pharmacist
            </MenuItem>
          </TextField>
        </Box>

        {/* Step 2: Google Sign-Up */}
        {!isGoogleSignUp && (
          <>
            <Box 
              sx={{ 
                position: 'relative', 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                mb: 2 
              }}
            >
              {googleProcessing ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} sx={{ color: isDark ? '#66CDAA' : '#428475' }} />
                  <Typography variant="caption" sx={{ color: isDark ? '#A5E6D2' : '#428475', fontWeight: 600 }}>
                    Signing up with Google...
                  </Typography>
                </Box>
              ) : (
                <Box
                  onClick={() => {
                    if (!formData.role) {
                      setRoleError('Please select your role (Patient, Doctor, or Pharmacist) above first before signing up with Google');
                    }
                  }}
                  sx={{ width: '100%', display: 'flex', justifyContent: 'center', cursor: !formData.role ? 'pointer' : 'default' }}
                >
                  <Box 
                    sx={{ 
                      pointerEvents: !formData.role ? 'none' : 'auto', 
                      opacity: !formData.role ? 0.5 : 1, 
                      borderRadius: '12px',
                      bgcolor: '#FFFFFF',
                      boxShadow: highlightGoogle 
                        ? '0 0 0 4px rgba(66, 133, 244, 0.45), 0 6px 20px rgba(66, 133, 244, 0.25)' 
                        : isDark ? '0 4px 16px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.3)' : '0 4px 14px rgba(0, 0, 0, 0.08)',
                      overflow: 'hidden',
                      p: '1px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transform: highlightGoogle ? 'scale(1.02)' : 'scale(1)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: isDark ? '0 6px 22px rgba(255, 255, 255, 0.3)' : '0 6px 18px rgba(0, 0, 0, 0.12)',
                        transform: highlightGoogle ? 'scale(1.02)' : 'translateY(-1px)'
                      }
                    }}
                  >
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={handleGoogleError}
                      useOneTap={false}
                      theme="outline"
                      size="large"
                      text="signup_with"
                      shape="rectangular"
                      width="318"
                    />
                  </Box>
                </Box>
              )}
            </Box>

            <Divider sx={{ mb: 2, borderColor: isDark ? 'rgba(102, 205, 170, 0.25)' : 'rgba(137, 215, 183, 0.3)' }}>
              <Typography variant="caption" sx={{ color: isDark ? '#A5E6D2' : '#428475', fontWeight: 700, px: 1 }}>
                OR REGISTER WITH EMAIL
              </Typography>
            </Divider>
          </>
        )}
        
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={1.5}>
            <Grid item xs={6}>
              <TextField
                name="firstName"
                required
                fullWidth
                id="firstName"
                label="First Name"
                placeholder="e.g. John"
                value={formData.firstName}
                onChange={handleChange}
                disabled={isGoogleSignUp}
                InputLabelProps={{ shrink: true, sx: { color: isDark ? '#A5E6D2' : '#2A6B5D', fontWeight: 600 } }}
                InputProps={{ 
                  sx: { 
                    borderRadius: '14px',
                    bgcolor: isGoogleSignUp ? (isDark ? 'rgba(102, 205, 170, 0.1)' : 'rgba(137, 215, 183, 0.08)') : (isDark ? 'rgba(14, 26, 23, 0.75)' : 'rgba(255, 255, 255, 0.95)'),
                    color: isDark ? '#F2FAF7' : '#123029',
                    '& input::placeholder': { color: isDark ? 'rgba(165, 230, 210, 0.6)' : '#4D9B8C', opacity: 0.85, fontWeight: 500 },
                    '& fieldset': { borderColor: isDark ? 'rgba(102, 205, 170, 0.35)' : 'rgba(137, 215, 183, 0.5)' },
                    '&:hover fieldset': { borderColor: isDark ? '#66CDAA !important' : '#428475 !important' },
                    '&.Mui-focused fieldset': { borderColor: isDark ? '#66CDAA !important' : '#2A6B5D !important' }
                  } 
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                required
                fullWidth
                id="lastName"
                label="Last Name"
                name="lastName"
                placeholder="e.g. Doe"
                value={formData.lastName}
                onChange={handleChange}
                disabled={isGoogleSignUp}
                InputLabelProps={{ shrink: true, sx: { color: isDark ? '#A5E6D2' : '#2A6B5D', fontWeight: 600 } }}
                InputProps={{ 
                  sx: { 
                    borderRadius: '14px',
                    bgcolor: isGoogleSignUp ? (isDark ? 'rgba(102, 205, 170, 0.1)' : 'rgba(137, 215, 183, 0.08)') : (isDark ? 'rgba(14, 26, 23, 0.75)' : 'rgba(255, 255, 255, 0.95)'),
                    color: isDark ? '#F2FAF7' : '#123029',
                    '& input::placeholder': { color: isDark ? 'rgba(165, 230, 210, 0.6)' : '#4D9B8C', opacity: 0.85, fontWeight: 500 },
                    '& fieldset': { borderColor: isDark ? 'rgba(102, 205, 170, 0.35)' : 'rgba(137, 215, 183, 0.5)' },
                    '&:hover fieldset': { borderColor: isDark ? '#66CDAA !important' : '#428475 !important' },
                    '&.Mui-focused fieldset': { borderColor: isDark ? '#66CDAA !important' : '#2A6B5D !important' }
                  } 
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                disabled={isGoogleSignUp}
                InputLabelProps={{ shrink: true, sx: { color: isDark ? '#A5E6D2' : '#2A6B5D', fontWeight: 600 } }}
                InputProps={{ 
                  sx: { 
                    borderRadius: '14px',
                    bgcolor: isGoogleSignUp ? (isDark ? 'rgba(102, 205, 170, 0.1)' : 'rgba(137, 215, 183, 0.08)') : (isDark ? 'rgba(14, 26, 23, 0.75)' : 'rgba(255, 255, 255, 0.95)'),
                    color: isDark ? '#F2FAF7' : '#123029',
                    '& input::placeholder': { color: isDark ? 'rgba(165, 230, 210, 0.6)' : '#4D9B8C', opacity: 0.85, fontWeight: 500 },
                    '& fieldset': { borderColor: isDark ? 'rgba(102, 205, 170, 0.35)' : 'rgba(137, 215, 183, 0.5)' },
                    '&:hover fieldset': { borderColor: isDark ? '#66CDAA !important' : '#428475 !important' },
                    '&.Mui-focused fieldset': { borderColor: isDark ? '#66CDAA !important' : '#2A6B5D !important' }
                  } 
                }}
              />
            </Grid>

            {/* Only show password fields for non-Google registration */}
            {!isGoogleSignUp && (
              <>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    name="password"
                    label="Password"
                    placeholder="Minimum 6 characters"
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={formData.password}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true, sx: { color: isDark ? '#A5E6D2' : '#2A6B5D', fontWeight: 600 } }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            sx={{ color: isDark ? '#66CDAA' : '#428475' }}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                      sx: { 
                        borderRadius: '14px',
                        bgcolor: isDark ? 'rgba(14, 26, 23, 0.75)' : 'rgba(255, 255, 255, 0.95)',
                        color: isDark ? '#F2FAF7' : '#123029',
                        '& input::placeholder': { color: isDark ? 'rgba(165, 230, 210, 0.6)' : '#4D9B8C', opacity: 0.85, fontWeight: 500 },
                        '& fieldset': { borderColor: isDark ? 'rgba(102, 205, 170, 0.35)' : 'rgba(137, 215, 183, 0.5)' },
                        '&:hover fieldset': { borderColor: isDark ? '#66CDAA !important' : '#428475 !important' },
                        '&.Mui-focused fieldset': { borderColor: isDark ? '#66CDAA !important' : '#2A6B5D !important' }
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    name="confirmPassword"
                    label="Confirm Password"
                    placeholder="Re-enter your password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    error={!!passwordError}
                    helperText={passwordError}
                    InputLabelProps={{ shrink: true, sx: { color: isDark ? '#A5E6D2' : '#2A6B5D', fontWeight: 600 } }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle confirm password visibility"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                            sx={{ color: isDark ? '#66CDAA' : '#428475' }}
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                      sx: { 
                        borderRadius: '14px',
                        bgcolor: isDark ? 'rgba(14, 26, 23, 0.75)' : 'rgba(255, 255, 255, 0.95)',
                        color: isDark ? '#F2FAF7' : '#123029',
                        '& input::placeholder': { color: isDark ? 'rgba(165, 230, 210, 0.6)' : '#4D9B8C', opacity: 0.85, fontWeight: 500 },
                        '& fieldset': { borderColor: isDark ? 'rgba(102, 205, 170, 0.35)' : 'rgba(137, 215, 183, 0.5)' },
                        '&:hover fieldset': { borderColor: isDark ? '#66CDAA !important' : '#428475 !important' },
                        '&.Mui-focused fieldset': { borderColor: isDark ? '#66CDAA !important' : '#2A6B5D !important' }
                      }
                    }}
                  />
                </Grid>
              </>
            )}
          </Grid>

          {/* Legal Consent Text */}
          <Typography
            sx={{
              mt: 2.5,
              mb: 0.5,
              fontSize: '0.72rem',
              color: isDark ? 'rgba(165, 230, 210, 0.75)' : '#428475',
              textAlign: 'center',
              lineHeight: 1.6,
              px: 1,
            }}
          >
            By creating an account, you agree to our{' '}
            <Link
              component={RouterLink}
              to="/privacy-policy"
              sx={{ color: isDark ? '#66CDAA' : '#1A312C', fontWeight: 700, textDecoration: 'underline' }}
            >
              Privacy Policy
            </Link>{' '}
            and{' '}
            <Link
              component={RouterLink}
              to="/terms"
              sx={{ color: isDark ? '#66CDAA' : '#1A312C', fontWeight: 700, textDecoration: 'underline' }}
            >
              Terms of Service
            </Link>.
          </Typography>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading || isSubmitting}
            sx={{ 
              mt: 3, 
              mb: 2, 
              height: 50, 
              background: isDark ? 'linear-gradient(135deg, #66CDAA 0%, #4D9B8C 100%)' : '#1A312C', 
              color: isDark ? '#0E1A17' : '#89D7B7',
              borderRadius: '16px',
              fontSize: '1rem',
              fontWeight: 800,
              boxShadow: (loading || isSubmitting) ? 'none' : isDark ? '0 8px 24px rgba(102, 205, 170, 0.3)' : '0 8px 24px rgba(26, 49, 44, 0.25)',
              border: isDark ? '1px solid #80E5C2' : '1px solid #89D7B7',
              '&:hover': { background: isDark ? 'linear-gradient(135deg, #80E5C2 0%, #52A694 100%)' : '#0F1D1A' },
              '&.Mui-disabled': { bgcolor: isDark ? 'rgba(102, 205, 170, 0.4)' : '#1A312C', color: isDark ? '#0E1A17' : '#89D7B7', opacity: 0.85 },
              transition: 'all 0.2s ease'
            }}
          >
            {(loading || isSubmitting) ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.2 }}>
                <CircularProgress size={20} sx={{ color: isDark ? '#0E1A17' : '#89D7B7' }} />
                <Typography variant="body1" sx={{ fontWeight: 800, color: isDark ? '#0E1A17' : '#89D7B7', fontSize: '0.95rem' }}>
                  Creating Account...
                </Typography>
              </Box>
            ) : isGoogleSignUp ? (
              formData.role 
                ? `Continue as ${formData.role === 'doctor' ? 'Doctor' : formData.role === 'pharmacist' ? 'Pharmacist' : 'Patient'}`
                : 'Continue Registration'
            ) : (
              formData.role 
                ? `Register as ${formData.role === 'doctor' ? 'Doctor' : formData.role === 'pharmacist' ? 'Pharmacist' : 'Patient'}`
                : 'Register Account'
            )}
          </Button>

          <Divider sx={{ my: 2, borderColor: isDark ? 'rgba(102, 205, 170, 0.25)' : 'rgba(137, 215, 183, 0.3)' }}>
            <Typography variant="caption" sx={{ color: isDark ? '#A5E6D2' : '#428475', fontWeight: 700, px: 1 }}>
              ALREADY REGISTERED?
            </Typography>
          </Divider>

          <Button
            component={RouterLink}
            to="/login"
            fullWidth
            variant="outlined"
            size="large"
            sx={{ 
              height: 46, 
              borderColor: isDark ? '#66CDAA' : '#428475', 
              color: isDark ? '#66CDAA' : '#1A312C',
              borderRadius: '16px',
              fontWeight: 800,
              borderWidth: '1.5px',
              '&:hover': { 
                bgcolor: isDark ? 'rgba(102, 205, 170, 0.15)' : 'rgba(137, 215, 183, 0.15)', 
                borderColor: isDark ? '#80E5C2' : '#1A312C',
                color: isDark ? '#80E5C2' : '#1A312C'
              }
            }}
          >
            Sign In to Existing Account
          </Button>

          {/* Medical Disclaimer */}
          <Typography
            sx={{
              mt: 2.5,
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
    </Grid>
  </Grid>
</Box>
</Box>
  );
};

export default Register;
