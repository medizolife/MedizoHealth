import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './contexts/AuthContext';
import { CustomThemeProvider } from './contexts/ThemeContext';
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
import PrivacyPolicy from './views/PrivacyPolicy';
import TermsOfService from './views/TermsOfService';

// Google OAuth Client ID
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '972944325297-fh67828kvguogf9coekjn6q07a2krv8o.apps.googleusercontent.com';

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <Box key={location.pathname} className="page-transition-wrapper">
      <Routes location={location}>
        <Route path="/" element={<Home />} />
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
          path="/prescriptions" 
          element={
            <ProtectedRoute>
              <DoctorPrescriptions />
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
        <Route path="/prescriptions/:id" element={<PrescriptionDetail />} />
        <Route path="/prescriptions/share/:id" element={<PrescriptionDetail />} />
        <Route path="/prescriptions/public/:id" element={<PrescriptionDetail />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Box>
  );
};

const App = () => {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <CustomThemeProvider>
        <AuthProvider>
          <Router>
            <Box sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
              <Header />
              <AnimatedRoutes />
              <MobileBottomNav />
            </Box>
          </Router>
        </AuthProvider>
      </CustomThemeProvider>
    </GoogleOAuthProvider>
  );
};

export default App;

