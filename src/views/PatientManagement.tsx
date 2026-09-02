'use client';
import React from 'react';
import { Container, Box, Typography, Paper } from '@mui/material';
import { People as PeopleIcon } from '@mui/icons-material';
import EnhancedPatientManagement from '../components/EnhancedPatientManagement';

const PatientManagement: React.FC = () => {
  return (
    <Container
      maxWidth="xl"
      disableGutters
      sx={{
        pt: { xs: 1, sm: 2.5 },
        pb: { xs: 10, sm: 6 },
        px: { xs: 1, sm: 2, md: 3 },
        width: '100%',
        maxWidth: '100% !important',
        boxSizing: 'border-box'
      }}
      className="animate-slide-up"
    >
      <Paper 
        className="glass-card-dark"
        sx={{ 
          p: { xs: 1.4, sm: 2.2 }, 
          mb: { xs: 1.5, sm: 2.5 },
          borderRadius: { xs: '14px', sm: '20px' },
          background: 'linear-gradient(135deg, rgba(26, 49, 44, 0.95) 0%, rgba(15, 29, 26, 0.98) 100%) !important'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <Box sx={{ p: { xs: 0.8, sm: 1.2 }, borderRadius: '10px', bgcolor: 'rgba(137, 215, 183, 0.2)', display: 'flex', flexShrink: 0 }}>
            <PeopleIcon sx={{ color: '#89D7B7', fontSize: { xs: 20, sm: 26 } }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em', fontSize: { xs: '0.95rem', sm: '1.2rem' } }}>
              Patient Management
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 244, 225, 0.75)', fontSize: { xs: '0.72rem', sm: '0.825rem' }, lineHeight: 1.3, display: { xs: 'none', sm: 'block' } }}>
              View, add, and manage medical profiles of patients under your care
            </Typography>
          </Box>
        </Box>
      </Paper>
      
      <EnhancedPatientManagement />
    </Container>
  );
};

export default PatientManagement;
