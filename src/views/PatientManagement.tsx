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
        pt: { xs: 1.5, sm: 2.5 },
        pb: { xs: 10, sm: 6 },
        px: { xs: 1.2, sm: 2.5, md: 3 },
        width: '100%',
        boxSizing: 'border-box'
      }}
      className="animate-slide-up"
    >
      <Paper 
        className="glass-card-dark"
        sx={{ 
          p: { xs: 1.8, sm: 2.5 }, 
          mb: { xs: 2, sm: 2.5 },
          borderRadius: { xs: '16px', sm: '20px' },
          background: 'linear-gradient(135deg, rgba(26, 49, 44, 0.95) 0%, rgba(15, 29, 26, 0.98) 100%) !important'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ p: { xs: 0.9, sm: 1.2 }, borderRadius: '12px', bgcolor: 'rgba(137, 215, 183, 0.2)', display: 'flex', flexShrink: 0 }}>
            <PeopleIcon sx={{ color: '#89D7B7', fontSize: { xs: 22, sm: 26 } }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', fontSize: { xs: '1.05rem', sm: '1.25rem' } }}>
              Patient Management
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 244, 225, 0.75)', fontSize: { xs: '0.75rem', sm: '0.825rem' }, lineHeight: 1.3 }}>
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
