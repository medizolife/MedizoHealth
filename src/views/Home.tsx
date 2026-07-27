'use client';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Container, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 'calc(100vh - 64px)',
  padding: theme.spacing(4),
  background: 'linear-gradient(45deg, #3f51b5 30%, #5c6bc0 90%)',
  color: 'white',
}));

const Home = () => {
  const navigate = useNavigate();

  return (
    <StyledBox>
      <Container maxWidth="md">
        <Typography variant="h2" component="h1" gutterBottom align="center">
          Simplified Healthcare Management System
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom align="center">
          A digital prescription platform connecting doctors and patients
        </Typography>
        <Typography variant="body1" paragraph align="center">
          Our system allows doctors to create digital prescriptions with QR codes for verification,
          while patients can securely view and download their prescriptions.
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Button
            variant="contained"
            color="secondary"
            size="large"
            onClick={() => navigate('/register')}
            sx={{ mr: 2 }}
          >
            Register
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            size="large"
            onClick={() => navigate('/login')}
          >
            Login
          </Button>
        </Box>
      </Container>
    </StyledBox>
  );
};

export default Home;
