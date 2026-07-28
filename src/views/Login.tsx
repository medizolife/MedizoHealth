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
  const { authState, login } = useAuth();
  const { loading, error, isAuthenticated } = authState;
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'patient' | 'doctor'>('patient');
  
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

  const handleForgotPassword = () => {
    alert('Password reset link sent to your registered email address.');
  };
  
  return (
    <Container component="main" maxWidth="xs" sx={{ pt: { xs: 2, sm: 4 }, pb: 6, px: 2 }} className="animate-slide-up">
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
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box
            component="img"
            src="/LOGO.png"
            alt="Medizo Logo"
            sx={{ 
              width: 60, 
              height: 60, 
              borderRadius: '16px', 
              mb: 1.5,
              border: '2px solid #89D7B7',
              boxShadow: '0 4px 16px rgba(66, 132, 117, 0.2)'
            }}
          />
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#1A312C', letterSpacing: '-0.02em' }}>
            Welcome to Medizo
          </Typography>
          <Typography variant="body2" sx={{ color: '#428475', fontWeight: 600, mt: 0.5 }}>
            Sign in to access your digital prescriptions
          </Typography>
        </Box>

        {/* Role Selector Chips */}
        <Box sx={{ display: 'flex', gap: 1, mb: 3, justifyContent: 'center', p: 0.5, bgcolor: 'rgba(26, 49, 44, 0.05)', borderRadius: '16px' }}>
          <Chip
            icon={<PersonIcon sx={{ color: role === 'patient' ? '#1A312C !important' : '#428475 !important' }} />}
            label="Patient"
            clickable
            onClick={() => setRole('patient')}
            sx={{ 
              flex: 1, 
              height: 42, 
              fontWeight: 800,
              borderRadius: '12px',
              bgcolor: role === 'patient' ? '#89D7B7' : 'transparent',
              color: role === 'patient' ? '#1A312C' : '#428475',
              border: role === 'patient' ? '1px solid #428475' : 'none',
              transition: 'all 0.2s ease',
              '&:hover': { bgcolor: role === 'patient' ? '#78caa8' : 'rgba(137, 215, 183, 0.15)' }
            }}
          />
          <Chip
            icon={<DoctorIcon sx={{ color: role === 'doctor' ? '#FFF4E1 !important' : '#428475 !important' }} />}
            label="Doctor"
            clickable
            onClick={() => setRole('doctor')}
            sx={{ 
              flex: 1, 
              height: 42, 
              fontWeight: 800,
              borderRadius: '12px',
              bgcolor: role === 'doctor' ? '#1A312C' : 'transparent',
              color: role === 'doctor' ? '#FFF4E1' : '#428475',
              transition: 'all 0.2s ease',
              '&:hover': { bgcolor: role === 'doctor' ? '#0F1D1A' : 'rgba(26, 49, 44, 0.08)' }
            }}
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: '14px', bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#b91c1c', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            placeholder="e.g. doctor@medizo.life or patient@medizo.life"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            InputLabelProps={{
              sx: { color: '#2A6B5D', fontWeight: 600 }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon sx={{ color: '#428475' }} />
                </InputAdornment>
              ),
              sx: { 
                borderRadius: '16px',
                bgcolor: 'rgba(255, 255, 255, 0.95)',
                color: '#123029',
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
            margin="normal"
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
              sx: { color: '#2A6B5D', fontWeight: 600 }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon sx={{ color: '#428475' }} />
                </InputAdornment>
              ),
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
                borderRadius: '16px',
                bgcolor: 'rgba(255, 255, 255, 0.95)',
                color: '#123029',
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

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, mb: 1 }}>
            <Typography
              variant="caption"
              onClick={handleForgotPassword}
              sx={{
                color: '#428475',
                fontWeight: 700,
                cursor: 'pointer',
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
            size="large"
            disabled={loading}
            sx={{ 
              mt: 2, 
              mb: 2, 
              height: 52, 
              bgcolor: '#1A312C', 
              color: '#89D7B7',
              borderRadius: '16px',
              fontSize: '1rem',
              fontWeight: 800,
              boxShadow: '0 8px 24px rgba(26, 49, 44, 0.25)',
              border: '1px solid #89D7B7',
              '&:hover': { bgcolor: '#0F1D1A', boxShadow: '0 10px 28px rgba(26, 49, 44, 0.35)' } 
            }}
          >
            {loading ? <CircularProgress size={24} sx={{ color: '#89D7B7' }} /> : `Sign In as ${role === 'doctor' ? 'Doctor' : 'Patient'}`}
          </Button>

          <Divider sx={{ my: 2.5, borderColor: 'rgba(137, 215, 183, 0.3)' }}>
            <Typography variant="caption" sx={{ color: '#428475', fontWeight: 700, px: 1 }}>
              NEW TO MEDIZO?
            </Typography>
          </Divider>

          <Button
            component={RouterLink}
            to="/register"
            fullWidth
            variant="outlined"
            size="large"
            sx={{ 
              height: 48, 
              borderColor: '#428475', 
              color: '#1A312C',
              borderRadius: '16px',
              fontWeight: 800,
              borderWidth: '1.5px',
              '&:hover': { bgcolor: 'rgba(137, 215, 183, 0.15)', borderColor: '#1A312C' }
            }}
          >
            Create New Account
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;
