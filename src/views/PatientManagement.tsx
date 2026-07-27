'use client';
import React from 'react';
import { Container, Box, Typography } from '@mui/material';
import EnhancedPatientManagement from '../components/EnhancedPatientManagement';

const PatientManagement: React.FC = () => {
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Patient Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View and manage all patients under your care
        </Typography>
      </Box>
      <EnhancedPatientManagement />
    </Container>
  );
};

export default PatientManagement;
