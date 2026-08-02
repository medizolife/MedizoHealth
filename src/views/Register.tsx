'use client';
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';
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
  const { authState, register, googleLogin, googleCompleteRegistration } = useAuth();
  const { loading, error, isAuthenticated } = authState;
  
  // Check if we arrived from Google sign-in with pre-filled data
  const googleData: GoogleData | null = (location.state as any)?.googleData || null;
  const isGoogleSignUp = !!googleData;
  
  const [formData, setFormData] = useState({
    firstName: googleData?.firstName || '',
    lastName: googleData?.lastName || '',
    email: googleData?.email || '',
    password: '',
    confirmPassword: '',
    role: '' as 'doctor' | 'patient' | ''
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
      setRoleError('Please select your role (Patient or Doctor)');
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (isGoogleSignUp && googleData) {
        googleCompleteRegistration(googleData.token, googleData.user);
        return;
      }
      
      if (password !== confirmPassword) {
        setPasswordError('Passwords do not match');
        setIsSubmitting(false);
        return;
      }

      await register({ firstName, lastName, email, password, role: role as 'doctor' | 'patient' });
      navigate('/login');
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
      setRoleError('Please select your role (Patient or Doctor) before signing up with Google');
      return;
    }

    setGoogleProcessing(true);
    
    try {
      const result = await googleLogin(credentialResponse.credential, formData.role);
      
      if (result && result.isNewUser) {
        // Pre-fill the form with Google data and stay on this page
        setFormData(prev => ({
          ...prev,
          firstName: result.user.firstName || prev.firstName,
          lastName: result.user.lastName || prev.lastName,
          email: result.user.email || prev.email,
        }));
        // Store Google data in location state so we can complete registration
        navigate('/register', { 
          state: { 
            googleData: {
              firstName: result.user.firstName,
              lastName: result.user.lastName,
              email: result.user.email,
              token: result.token,
              user: result.user
            }
          },
          replace: true 
        });
      }
      // If result is void, existing user was auto-logged in
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
                      Medizo <Typography component="span" variant="caption" sx={{ color: 'var(--color-mint)', fontWeight: 800, fontSize: '0.8rem', letterSpacing: 1 }}>HEALTH</Typography>
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
                bgcolor: 'rgba(255, 255, 255, 0.94) !important',
                border: '1px solid rgba(137, 215, 183, 0.45) !important',
                boxShadow: '0 20px 50px rgba(26, 49, 44, 0.1) !important'
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
              border: '2px solid #89D7B7',
              boxShadow: '0 4px 16px rgba(66, 132, 117, 0.2)'
            }}
          />
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#1A312C', letterSpacing: '-0.02em' }}>
            {isGoogleSignUp ? 'Complete Registration' : 'Create Account'}
          </Typography>
          <Typography variant="body2" sx={{ color: '#428475', fontWeight: 600, mt: 0.5 }}>
            {isGoogleSignUp 
              ? 'Select your role to complete registration' 
              : 'Join Medizo Healthcare Platform'}
          </Typography>
        </Box>

        {/* Google info banner when signing up with Google */}
        {isGoogleSignUp && (
          <Alert 
            severity="info" 
            icon={<GoogleIcon sx={{ color: '#428475' }} />}
            sx={{ 
              mb: 2, 
              borderRadius: '14px', 
              bgcolor: 'rgba(137, 215, 183, 0.12)', 
              color: '#1A312C', 
              border: '1px solid rgba(137, 215, 183, 0.3)',
              '& .MuiAlert-icon': { color: '#428475' }
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Signed in as {googleData?.email}
            </Typography>
            <Typography variant="caption" sx={{ color: '#428475' }}>
              Please select your role below to complete registration
            </Typography>
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: '14px', bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#b91c1c', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            {error}
          </Alert>
        )}

        {googleError && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: '14px', bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#b91c1c', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
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
            helperText={roleError || 'Select whether you are registering as a Patient or Doctor'}
            InputLabelProps={{ shrink: true, sx: { color: '#2A6B5D', fontWeight: 700 } }}
            SelectProps={{
              displayEmpty: true,
            }}
            InputProps={{ 
              sx: { 
                borderRadius: '14px',
                bgcolor: 'rgba(255, 255, 255, 0.95)',
                color: '#123029',
                fontWeight: 700,
                '& fieldset': { borderColor: roleError ? '#ef4444' : 'rgba(137, 215, 183, 0.6)' },
                '&:hover fieldset': { borderColor: '#428475 !important' }
              } 
            }}
          >
            <MenuItem value="" disabled sx={{ color: '#888', fontStyle: 'italic' }}>
              -- Select Role --
            </MenuItem>
            <MenuItem value="patient" sx={{ fontWeight: 600, py: 1.2 }}>
              Patient
            </MenuItem>
            <MenuItem value="doctor" sx={{ fontWeight: 600, py: 1.2 }}>
              Doctor
            </MenuItem>
          </TextField>
        </Box>

        {/* Step 2: Google Sign-Up (Guarded by Role Selection & Highlighted on Selection) */}
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
                  <CircularProgress size={20} sx={{ color: '#428475' }} />
                  <Typography variant="caption" sx={{ color: '#428475', fontWeight: 600 }}>
                    Signing up with Google...
                  </Typography>
                </Box>
              ) : (
                <Box
                  onClick={() => {
                    if (!formData.role) {
                      setRoleError('Please select your role (Patient or Doctor) above first before signing up with Google');
                    }
                  }}
                  sx={{ width: '100%', display: 'flex', justifyContent: 'center', cursor: !formData.role ? 'pointer' : 'default' }}
                >
                  <Box 
                    sx={{ 
                      pointerEvents: !formData.role ? 'none' : 'auto', 
                      opacity: !formData.role ? 0.5 : 1, 
                      borderRadius: '6px',
                      transform: highlightGoogle ? 'scale(1.02)' : 'scale(1)',
                      boxShadow: highlightGoogle 
                        ? '0 0 0 4px rgba(66, 133, 244, 0.45), 0 6px 20px rgba(66, 133, 244, 0.25)' 
                        : 'none',
                      transition: 'all 0.3s ease'
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
                      width="320"
                    />
                  </Box>
                </Box>
              )}
            </Box>

            <Divider sx={{ mb: 2, borderColor: 'rgba(137, 215, 183, 0.3)' }}>
              <Typography variant="caption" sx={{ color: '#428475', fontWeight: 700, px: 1 }}>
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
                InputLabelProps={{ shrink: true, sx: { color: '#2A6B5D', fontWeight: 600 } }}
                InputProps={{ 
                  sx: { 
                    borderRadius: '14px',
                    bgcolor: isGoogleSignUp ? 'rgba(137, 215, 183, 0.08)' : 'rgba(255, 255, 255, 0.95)',
                    color: '#123029',
                    '& input::placeholder': { color: '#4D9B8C', opacity: 0.85, fontWeight: 500 },
                    '& fieldset': { borderColor: 'rgba(137, 215, 183, 0.5)' },
                    '&:hover fieldset': { borderColor: '#428475 !important' }
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
                InputLabelProps={{ shrink: true, sx: { color: '#2A6B5D', fontWeight: 600 } }}
                InputProps={{ 
                  sx: { 
                    borderRadius: '14px',
                    bgcolor: isGoogleSignUp ? 'rgba(137, 215, 183, 0.08)' : 'rgba(255, 255, 255, 0.95)',
                    color: '#123029',
                    '& input::placeholder': { color: '#4D9B8C', opacity: 0.85, fontWeight: 500 },
                    '& fieldset': { borderColor: 'rgba(137, 215, 183, 0.5)' },
                    '&:hover fieldset': { borderColor: '#428475 !important' }
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
                InputLabelProps={{ shrink: true, sx: { color: '#2A6B5D', fontWeight: 600 } }}
                InputProps={{ 
                  sx: { 
                    borderRadius: '14px',
                    bgcolor: isGoogleSignUp ? 'rgba(137, 215, 183, 0.08)' : 'rgba(255, 255, 255, 0.95)',
                    color: '#123029',
                    '& input::placeholder': { color: '#4D9B8C', opacity: 0.85, fontWeight: 500 },
                    '& fieldset': { borderColor: 'rgba(137, 215, 183, 0.5)' },
                    '&:hover fieldset': { borderColor: '#428475 !important' }
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
                    InputLabelProps={{ shrink: true, sx: { color: '#2A6B5D', fontWeight: 600 } }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            sx={{ color: '#428475' }}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                      sx: { 
                        borderRadius: '14px',
                        bgcolor: 'rgba(255, 255, 255, 0.95)',
                        color: '#123029',
                        '& input::placeholder': { color: '#4D9B8C', opacity: 0.85, fontWeight: 500 },
                        '& fieldset': { borderColor: 'rgba(137, 215, 183, 0.5)' },
                        '&:hover fieldset': { borderColor: '#428475 !important' }
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
                    InputLabelProps={{ shrink: true, sx: { color: '#2A6B5D', fontWeight: 600 } }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle confirm password visibility"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                            sx={{ color: '#428475' }}
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                      sx: { 
                        borderRadius: '14px',
                        bgcolor: 'rgba(255, 255, 255, 0.95)',
                        color: '#123029',
                        '& input::placeholder': { color: '#4D9B8C', opacity: 0.85, fontWeight: 500 },
                        '& fieldset': { borderColor: 'rgba(137, 215, 183, 0.5)' },
                        '&:hover fieldset': { borderColor: '#428475 !important' }
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
              color: '#428475',
              textAlign: 'center',
              lineHeight: 1.6,
              px: 1,
            }}
          >
            By creating an account, you agree to our{' '}
            <Link
              component={RouterLink}
              to="/privacy-policy"
              sx={{ color: '#1A312C', fontWeight: 700, textDecoration: 'underline' }}
            >
              Privacy Policy
            </Link>{' '}
            and{' '}
            <Link
              component={RouterLink}
              to="/terms"
              sx={{ color: '#1A312C', fontWeight: 700, textDecoration: 'underline' }}
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
              bgcolor: '#1A312C', 
              color: '#89D7B7',
              borderRadius: '16px',
              fontSize: '1rem',
              fontWeight: 800,
              boxShadow: (loading || isSubmitting) ? 'none' : '0 8px 24px rgba(26, 49, 44, 0.25)',
              border: '1px solid #89D7B7',
              '&:hover': { bgcolor: '#0F1D1A' },
              '&.Mui-disabled': { bgcolor: '#1A312C', color: '#89D7B7', opacity: 0.85 },
              transition: 'all 0.2s ease'
            }}
          >
            {(loading || isSubmitting) ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.2 }}>
                <CircularProgress size={20} sx={{ color: '#89D7B7' }} />
                <Typography variant="body1" sx={{ fontWeight: 800, color: '#89D7B7', fontSize: '0.95rem' }}>
                  Creating Account...
                </Typography>
              </Box>
            ) : isGoogleSignUp ? (
              formData.role 
                ? `Continue as ${formData.role === 'doctor' ? 'Doctor' : 'Patient'}`
                : 'Continue Registration'
            ) : (
              formData.role 
                ? `Register as ${formData.role === 'doctor' ? 'Doctor' : 'Patient'}`
                : 'Register Account'
            )}
          </Button>

          <Divider sx={{ my: 2, borderColor: 'rgba(137, 215, 183, 0.3)' }}>
            <Typography variant="caption" sx={{ color: '#428475', fontWeight: 700, px: 1 }}>
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
              borderColor: '#428475', 
              color: '#1A312C',
              borderRadius: '16px',
              fontWeight: 800,
              borderWidth: '1.5px',
              '&:hover': { bgcolor: 'rgba(137, 215, 183, 0.15)', borderColor: '#1A312C' }
            }}
          >
            Sign In to Existing Account
          </Button>

          {/* Medical Disclaimer */}
          <Typography
            sx={{
              mt: 2.5,
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
    </Grid>
  </Grid>
</Box>
</Box>
  );
};

export default Register;

