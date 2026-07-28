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
    <Container component="main" maxWidth="xs" sx={{ pt: { xs: 1, sm: 2 }, pb: 2, px: 2 }} className="animate-slide-up">
      <Paper 
        elevation={0} 
        className="glass-panel"
        sx={{ 
          p: { xs: 2.5, sm: 3 }, 
          borderRadius: '24px !important', 
          bgcolor: 'rgba(255, 255, 255, 0.92) !important',
          border: '1px solid rgba(137, 215, 183, 0.4) !important',
          boxShadow: '0 12px 32px rgba(26, 49, 44, 0.08) !important'
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Box
            component="img"
            src="/LOGO.png"
            alt="Medizo Logo"
            sx={{ 
              width: 48, 
              height: 48, 
              borderRadius: '14px', 
              mb: 1,
              border: '2px solid #89D7B7',
              boxShadow: '0 4px 12px rgba(66, 132, 117, 0.18)'
            }}
          />
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#1A312C', letterSpacing: '-0.02em' }}>
            Welcome to Medizo
          </Typography>
          <Typography variant="caption" sx={{ color: '#428475', fontWeight: 600, display: 'block', mt: 0.2 }}>
            Sign in to access your digital prescriptions
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 1.5, py: 0.5, borderRadius: '12px', bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#b91c1c', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            {error}
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
              sx: { color: '#2A6B5D', fontWeight: 600 }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon sx={{ color: '#428475', fontSize: 20 }} />
                </InputAdornment>
              ),
              sx: { 
                borderRadius: '14px',
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
              sx: { color: '#2A6B5D', fontWeight: 600 }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon sx={{ color: '#428475', fontSize: 20 }} />
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

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5, mb: 0.5 }}>
            <Typography
              variant="caption"
              onClick={handleForgotPassword}
              sx={{
                color: '#428475',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '0.75rem',
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
              mt: 1.5, 
              mb: 1.5, 
              height: 46, 
              bgcolor: '#1A312C', 
              color: '#89D7B7',
              borderRadius: '14px',
              fontSize: '0.95rem',
              fontWeight: 800,
              boxShadow: '0 6px 20px rgba(26, 49, 44, 0.2)',
              border: '1px solid #89D7B7',
              '&:hover': { bgcolor: '#0F1D1A' } 
            }}
          >
            {loading ? <CircularProgress size={22} sx={{ color: '#89D7B7' }} /> : 'Sign In'}
          </Button>

          <Divider sx={{ my: 1.5, borderColor: 'rgba(137, 215, 183, 0.3)' }}>
            <Typography variant="caption" sx={{ color: '#428475', fontWeight: 700, px: 1, fontSize: '0.7rem' }}>
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
              height: 44, 
              borderColor: '#428475', 
              color: '#1A312C',
              borderRadius: '14px',
              fontWeight: 800,
              borderWidth: '1.5px',
              fontSize: '0.875rem',
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
