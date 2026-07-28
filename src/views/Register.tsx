'use client';
import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
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
  Grid,
  Chip,
  Divider,
  IconButton,
  InputAdornment
} from '@mui/material';
import { 
  Person as PersonIcon, 
  MedicalServices as DoctorIcon,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';

const Register = () => {
  const navigate = useNavigate();
  const { authState, register } = useAuth();
  const { loading, error, isAuthenticated } = authState;
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'patient' as 'doctor' | 'patient'
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  
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
  };
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { firstName, lastName, email, password, confirmPassword, role } = formData;
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    try {
      await register({ firstName, lastName, email, password, role });
      navigate('/login');
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };
  
  return (
    <Container component="main" maxWidth="xs" sx={{ pt: { xs: 2, sm: 3 }, pb: 6, px: 2 }} className="animate-slide-up">
      <Paper 
        elevation={0} 
        className="glass-panel"
        sx={{ 
          p: { xs: 3, sm: 4 }, 
          borderRadius: '28px !important', 
          bgcolor: 'rgba(255, 255, 255, 0.88) !important',
          border: '1px solid rgba(137, 215, 183, 0.4) !important',
          boxShadow: '0 16px 40px rgba(26, 49, 44, 0.08) !important'
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
            Create Account
          </Typography>
          <Typography variant="body2" sx={{ color: '#428475', fontWeight: 600, mt: 0.5 }}>
            Join Medizo Healthcare Platform
          </Typography>
        </Box>

        {/* Role Selector Chips */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2.5, justifyContent: 'center', p: 0.5, bgcolor: 'rgba(26, 49, 44, 0.05)', borderRadius: '16px' }}>
          <Chip
            icon={<PersonIcon sx={{ color: formData.role === 'patient' ? '#1A312C !important' : '#428475 !important' }} />}
            label="Patient"
            clickable
            onClick={() => setFormData({ ...formData, role: 'patient' })}
            sx={{ 
              flex: 1, 
              height: 40, 
              fontWeight: 800,
              borderRadius: '12px',
              bgcolor: formData.role === 'patient' ? '#89D7B7' : 'transparent',
              color: formData.role === 'patient' ? '#1A312C' : '#428475',
              border: formData.role === 'patient' ? '1px solid #428475' : 'none',
              transition: 'all 0.2s ease',
              '&:hover': { bgcolor: formData.role === 'patient' ? '#78caa8' : 'rgba(137, 215, 183, 0.15)' }
            }}
          />
          <Chip
            icon={<DoctorIcon sx={{ color: formData.role === 'doctor' ? '#FFF4E1 !important' : '#428475 !important' }} />}
            label="Doctor"
            clickable
            onClick={() => setFormData({ ...formData, role: 'doctor' })}
            sx={{ 
              flex: 1, 
              height: 40, 
              fontWeight: 800,
              borderRadius: '12px',
              bgcolor: formData.role === 'doctor' ? '#1A312C' : 'transparent',
              color: formData.role === 'doctor' ? '#FFF4E1' : '#428475',
              transition: 'all 0.2s ease',
              '&:hover': { bgcolor: formData.role === 'doctor' ? '#0F1D1A' : 'rgba(26, 49, 44, 0.08)' }
            }}
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: '14px', bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#b91c1c', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            {error}
          </Alert>
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
                value={formData.firstName}
                onChange={handleChange}
                InputProps={{ 
                  sx: { 
                    borderRadius: '14px',
                    bgcolor: 'rgba(255, 255, 255, 0.8)',
                    '& fieldset': { borderColor: 'rgba(137, 215, 183, 0.4)' },
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
                value={formData.lastName}
                onChange={handleChange}
                InputProps={{ 
                  sx: { 
                    borderRadius: '14px',
                    bgcolor: 'rgba(255, 255, 255, 0.8)',
                    '& fieldset': { borderColor: 'rgba(137, 215, 183, 0.4)' },
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
                value={formData.email}
                onChange={handleChange}
                InputProps={{ 
                  sx: { 
                    borderRadius: '14px',
                    bgcolor: 'rgba(255, 255, 255, 0.8)',
                    '& fieldset': { borderColor: 'rgba(137, 215, 183, 0.4)' },
                    '&:hover fieldset': { borderColor: '#428475 !important' }
                  } 
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={formData.password}
                onChange={handleChange}
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
                    bgcolor: 'rgba(255, 255, 255, 0.8)',
                    '& fieldset': { borderColor: 'rgba(137, 215, 183, 0.4)' },
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
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={!!passwordError}
                helperText={passwordError}
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
                    bgcolor: 'rgba(255, 255, 255, 0.8)',
                    '& fieldset': { borderColor: 'rgba(137, 215, 183, 0.4)' },
                    '&:hover fieldset': { borderColor: '#428475 !important' }
                  }
                }}
              />
            </Grid>
          </Grid>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            sx={{ 
              mt: 3, 
              mb: 2, 
              height: 50, 
              bgcolor: '#1A312C', 
              color: '#89D7B7',
              borderRadius: '16px',
              fontSize: '1rem',
              fontWeight: 800,
              boxShadow: '0 8px 24px rgba(26, 49, 44, 0.25)',
              border: '1px solid #89D7B7',
              '&:hover': { bgcolor: '#0F1D1A' } 
            }}
          >
            {loading ? <CircularProgress size={24} sx={{ color: '#89D7B7' }} /> : `Register as ${formData.role === 'doctor' ? 'Doctor' : 'Patient'}`}
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
        </Box>
      </Paper>
    </Container>
  );
};

export default Register;
