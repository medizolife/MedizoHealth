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
import BlockIcon from '@mui/icons-material/Block';

const Unauthorized = () => {
  return (
    <Container maxWidth="md" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
        <BlockIcon color="error" sx={{ fontSize: 60 }} />
        <Typography variant="h4" component="h1" gutterBottom sx={{ mt: 2 }}>
          Access Denied
        </Typography>
        <Typography variant="body1" paragraph>
          You do not have permission to access this page.
        </Typography>
        <Box sx={{ mt: 4 }}>
          <Button 
            variant="contained" 
            component={Link} 
            to="/dashboard"
          >
            Go to Dashboard
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Unauthorized;
