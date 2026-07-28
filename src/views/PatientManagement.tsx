'use client';
import React from 'react';
import { Container, Box, Typography, Paper } from '@mui/material';
import { People as PeopleIcon } from '@mui/icons-material';
import EnhancedPatientManagement from '../components/EnhancedPatientManagement';

const PatientManagement: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ pt: { xs: 2, sm: 3 }, pb: 6, px: { xs: 2, sm: 3 } }} className="animate-slide-up">
      <Paper 
        className="glass-card-dark"
        sx={{ 
          p: { xs: 2.5, sm: 3 }, 
          mb: 3,
          background: 'linear-gradient(135deg, rgba(26, 49, 44, 0.95) 0%, rgba(15, 29, 26, 0.98) 100%) !important'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ p: 1.2, borderRadius: '14px', bgcolor: 'rgba(137, 215, 183, 0.2)', display: 'flex' }}>
            <PeopleIcon sx={{ color: '#89D7B7', fontSize: 26 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
              Patient Management
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 244, 225, 0.75)', fontSize: '0.825rem' }}>
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
