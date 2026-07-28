import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Container, 
  Box, 
  Button, 
  Paper, 
  Grid, 
  Card, 
  CardContent,
  CardActions,
  Avatar,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Tab,
  Tabs,
  Dialog,
  DialogContent,
  CircularProgress
} from '@mui/material';
import { 
  LocalHospital as LocalHospitalIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  Security as SecurityIcon
} from '@mui/icons-material';

// Import auth components
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';

// Import prescription components
import PrescriptionForm from './components/prescriptions/PrescriptionForm';
import PrescriptionList from './components/prescriptions/PrescriptionList';

// Import auth context
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Create a theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#3f51b5',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

// Main app content component
const AppContent = () => {
  const { isAuthenticated, user, logout, loading } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authTabValue, setAuthTabValue] = useState(0);
  const [activeContent, setActiveContent] = useState('dashboard');

  const handleOpenAuthDialog = (tabValue = 0) => {
    setAuthTabValue(tabValue);
    setAuthDialogOpen(true);
  };

  const handleCloseAuthDialog = () => {
    setAuthDialogOpen(false);
  };

  const handleChangeAuthTab = (event, newValue) => {
    setAuthTabValue(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading...</Typography>
      </Box>
    );
  }

  return (
    <div className="App">
      <AppBar position="static">
        <Toolbar>
          <LocalHospitalIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Healthcare Management System
          </Typography>
          {isAuthenticated ? (
            <>
              <Typography variant="body1" sx={{ mr: 2 }}>
                Welcome, {user ? (user.role === 'doctor' ? `Dr. ${user.lastName}` : `${user.firstName} ${user.lastName}`) : 'User'}
              </Typography>
              <Button color="inherit" onClick={logout}>Logout</Button>
            </>
          ) : (
            <>
              <Button color="inherit" onClick={() => handleOpenAuthDialog(0)}>Login</Button>
              <Button color="inherit" onClick={() => handleOpenAuthDialog(1)}>Register</Button>
            </>
          )}
        </Toolbar>
      </AppBar>

      {/* Authentication Dialog */}
      <Dialog 
        open={authDialogOpen} 
        onClose={handleCloseAuthDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={authTabValue} 
              onChange={handleChangeAuthTab} 
              variant="fullWidth"
            >
              <Tab label="Login" />
              <Tab label="Register" />
            </Tabs>
          </Box>
          <Box p={3}>
            {authTabValue === 0 ? (
              <LoginForm 
                onSwitchToRegister={() => setAuthTabValue(1)} 
                onClose={handleCloseAuthDialog}
              />
            ) : (
              <RegisterForm onClose={handleCloseAuthDialog} />
            )}
          </Box>
        </DialogContent>
      </Dialog>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {(!isAuthenticated || (isAuthenticated && activeContent === 'dashboard')) && (
          <Box sx={{ my: 4, textAlign: 'center' }}>
            <Typography variant="h3" component="h1" gutterBottom>
              Digital Prescription Platform
            </Typography>
            <Typography variant="h5" component="h2" color="text.secondary" gutterBottom>
              Connecting doctors and patients seamlessly
            </Typography>
          </Box>
        )}

        {!isAuthenticated && (
          <Paper elevation={3} sx={{ p: 4, my: 4, background: 'linear-gradient(45deg, #f5f7ff 30%, #e8eaff 90%)' }}>
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2 }}>
                  <Typography variant="h4" component="h2" gutterBottom>
                    For Doctors
                  </Typography>
                  <Typography variant="body1" paragraph>
                    Create digital prescriptions with QR code verification. Manage your patients and track prescription history efficiently.
                  </Typography>
                  <Button 
                    variant="contained" 
                    size="large" 
                    color="primary"
                    onClick={() => handleOpenAuthDialog(0)}
                    startIcon={<PersonIcon />}
                  >
                    Login as Doctor
                  </Button>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2 }}>
                  <Typography variant="h4" component="h2" gutterBottom>
                    For Patients
                  </Typography>
                  <Typography variant="body1" paragraph>
                    Access your prescriptions securely. Download digital copies with QR verification. Never lose a prescription again.
                  </Typography>
                  <Button 
                    variant="contained" 
                    size="large" 
                    color="secondary"
                    onClick={() => handleOpenAuthDialog(0)}
                    startIcon={<PersonIcon />}
                  >
                    Login as Patient
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        )}

        {isAuthenticated && activeContent === 'dashboard' && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Avatar sx={{ bgcolor: 'primary.main', mb: 2 }}>
                    <AssignmentIcon />
                  </Avatar>
                  <Typography variant="h5" component="div" gutterBottom>
                    {user?.role === 'doctor' ? 'Create Prescription' : 'View Prescriptions'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user?.role === 'doctor' 
                      ? 'Create new digital prescriptions for your patients with QR code verification.' 
                      : 'Access your current and past prescriptions securely.'}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small"
                    onClick={() => setActiveContent(user?.role === 'doctor' ? 'createPrescription' : 'viewPrescriptions')}
                  >
                    {user?.role === 'doctor' ? 'Create New' : 'View All'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Avatar sx={{ bgcolor: 'secondary.main', mb: 2 }}>
                    <PersonIcon />
                  </Avatar>
                  <Typography variant="h5" component="div" gutterBottom>
                    {user?.role === 'doctor' ? 'Manage Patients' : 'My Profile'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user?.role === 'doctor' 
                      ? 'View and manage your patient list. Check patient history and details.' 
                      : 'Update your personal information and contact details.'}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small"
                    onClick={() => setActiveContent(user?.role === 'doctor' ? 'managePatients' : 'profile')}
                  >
                    {user?.role === 'doctor' ? 'View Patients' : 'Edit Profile'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Avatar sx={{ bgcolor: 'error.main', mb: 2 }}>
                    <SecurityIcon />
                  </Avatar>
                  <Typography variant="h5" component="div" gutterBottom>
                    Security Settings
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Update your password and security preferences. Manage your account security.
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small"
                    onClick={() => setActiveContent('security')}
                  >
                    Manage Security
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Render active content based on state */}
        {isAuthenticated && activeContent !== 'dashboard' && (
          <Box sx={{ mt: 4 }}>
            {/* Back button */}
            <Button 
              variant="outlined" 
              sx={{ mb: 2 }}
              onClick={() => setActiveContent('dashboard')}
            >
              Back to Dashboard
            </Button>
            
            {/* Content components */}
            {activeContent === 'createPrescription' && user?.role === 'doctor' && (
              <PrescriptionForm onCreatePrescription={() => setActiveContent('dashboard')} />
            )}
            
            {activeContent === 'viewPrescriptions' && user?.role === 'patient' && (
              <PrescriptionList />
            )}
            
            {activeContent === 'managePatients' && user?.role === 'doctor' && (
              <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Typography variant="h5" gutterBottom>Patient Management</Typography>
                <Typography variant="body1" color="text.secondary">
                  Patient management functionality coming soon.
                </Typography>
              </Box>
            )}
            
            {activeContent === 'profile' && (
              <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Typography variant="h5" gutterBottom>User Profile</Typography>
                <Typography variant="body1" color="text.secondary">
                  Profile management functionality coming soon.
                </Typography>
              </Box>
            )}
            
            {activeContent === 'security' && (
              <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Typography variant="h5" gutterBottom>Security Settings</Typography>
                <Typography variant="body1" color="text.secondary">
                  Security settings functionality coming soon.
                </Typography>
              </Box>
            )}
          </Box>
        )}
        
        <Box sx={{ mt: 8, mb: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} Healthcare Management System. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
