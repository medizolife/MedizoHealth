import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';

// Components
import Header from './components/Header';
import MobileBottomNav from './components/MobileBottomNav';
import ProtectedRoute from './components/ProtectedRoute';

// Views
import Home from './views/Home';
import Login from './views/Login';
import Register from './views/Register';
import Dashboard from './views/Dashboard';
import Profile from './views/Profile';
import NewPrescription from './views/NewPrescription';
import PrescriptionDetail from './views/PrescriptionDetail';
import DoctorPrescriptions from './views/DoctorPrescriptions';
import PatientManagement from './views/PatientManagement';
import NotFound from './views/NotFound';
import Unauthorized from './views/Unauthorized';

// Create mobile-optimized theme
const mobileTheme = createTheme({
  palette: {
    primary: {
      main: '#134F4D',
      light: '#1d7370',
      dark: '#0a2c2b',
    },
    secondary: {
      main: '#ec4899',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 16,
  },
});

const App = () => {
  return (
    <ThemeProvider theme={mobileTheme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Box sx={{ minHeight: '100vh', pb: 9, bgcolor: '#f8fafc' }}>
            <Header />
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/home" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/prescriptions/new" 
                element={
                  <ProtectedRoute requiredRole="doctor">
                    <NewPrescription />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/prescriptions/all" 
                element={
                  <ProtectedRoute>
                    <DoctorPrescriptions />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/patients" 
                element={
                  <ProtectedRoute requiredRole="doctor">
                    <PatientManagement />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/prescriptions/:id" 
                element={
                  <ProtectedRoute>
                    <PrescriptionDetail />
                  </ProtectedRoute>
                } 
              />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <MobileBottomNav />
          </Box>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
