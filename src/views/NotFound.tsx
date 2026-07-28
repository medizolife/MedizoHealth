'use client';
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box,
  Button,
  Paper
} from '@mui/material';
import { ErrorOutline as ErrorIcon, Home as HomeIcon } from '@mui/icons-material';

const NotFound = () => {
  return (
    <Container maxWidth="xs" sx={{ pt: 8, pb: 8, px: 2 }} className="animate-slide-up">
      <Paper 
        elevation={0} 
        className="glass-panel"
        sx={{ 
          p: 4, 
          textAlign: 'center',
          borderRadius: '28px !important',
          bgcolor: 'rgba(255, 255, 255, 0.88) !important',
          border: '1px solid rgba(137, 215, 183, 0.4) !important',
          boxShadow: '0 16px 40px rgba(26, 49, 44, 0.08) !important'
        }}
      >
        <Box 
          sx={{ 
            p: 2, 
            borderRadius: '50%', 
            bgcolor: 'rgba(239, 68, 68, 0.1)', 
            width: 80, 
            height: 80, 
            mx: 'auto', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            mb: 2,
            border: '1px solid rgba(239, 68, 68, 0.2)'
          }}
        >
          <ErrorIcon sx={{ fontSize: 44, color: '#ef4444' }} />
        </Box>

        <Typography variant="h2" sx={{ fontWeight: 800, color: '#1A312C', letterSpacing: '-0.03em', mb: 0.5 }}>
          404
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#428475', mb: 1 }}>
          Page Not Found
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
          The requested healthcare portal route does not exist or has been moved.
        </Typography>

        <Button 
          variant="contained" 
          component={Link} 
          to="/dashboard"
          startIcon={<HomeIcon />}
          sx={{ 
            bgcolor: '#1A312C', 
            color: '#89D7B7',
            px: 3,
            py: 1.2,
            borderRadius: '16px',
            fontWeight: 800,
            boxShadow: '0 8px 24px rgba(26, 49, 44, 0.25)',
            border: '1px solid #89D7B7',
            '&:hover': { bgcolor: '#0F1D1A' }
          }}
        >
          Return to Dashboard
        </Button>
      </Paper>
    </Container>
  );
};

export default NotFound;
