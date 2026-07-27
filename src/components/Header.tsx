'use client';
import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  IconButton, 
  Avatar, 
  Chip,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import { 
  Menu as MenuIcon,
  LocalHospital as LocalHospitalIcon,
  Medication as MedicationIcon,
  Person as PersonIcon,
  ExitToApp as ExitToAppIcon,
  Security as SecurityIcon,
  VerifiedUser as VerifiedUserIcon
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
  const { authState, logout } = useAuth();
  const { isAuthenticated, user } = authState;
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleDrawer = (open: boolean) => () => {
    setDrawerOpen(open);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setDrawerOpen(false);
  };

  const handleLogout = () => {
    setDrawerOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <>
      <AppBar 
        position="sticky" 
        elevation={0}
        sx={{ 
          bgcolor: '#134F4D', 
          color: '#ffffff',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: 2, minHeight: '56px !important' }}>
          {/* Logo & Brand */}
          <Box 
            component={RouterLink} 
            to="/" 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              textDecoration: 'none', 
              color: 'inherit',
              gap: 1
            }}
          >
            <Box
              component="img"
              src="/LOGO.png"
              alt="Medizo Logo"
              sx={{ width: 32, height: 32, borderRadius: '6px' }}
            />
            <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 0.5, fontSize: '1.1rem' }}>
              Medizo <Typography component="span" variant="caption" sx={{ color: '#4ade80', fontWeight: 700, ml: 0.5 }}>Mobile</Typography>
            </Typography>
          </Box>

          {/* User Info / Mobile Drawer Trigger */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isAuthenticated && user && (
              <Chip
                avatar={
                  <Avatar sx={{ bgcolor: user.role === 'doctor' ? '#3b82f6' : '#ec4899', color: '#fff', width: 24, height: 24 }}>
                    {user.firstName?.[0] || 'U'}
                  </Avatar>
                }
                label={user.role === 'doctor' ? `Dr. ${user.lastName}` : user.firstName}
                size="small"
                sx={{ 
                  bgcolor: 'rgba(255, 255, 255, 0.15)', 
                  color: '#ffffff', 
                  fontWeight: 600,
                  fontSize: '0.75rem'
                }}
              />
            )}
            
            <IconButton
              edge="end"
              color="inherit"
              aria-label="menu"
              onClick={toggleDrawer(true)}
              sx={{ p: 1 }}
            >
              <MenuIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Slide-out Mobile App Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
        PaperProps={{
          sx: {
            width: 280,
            borderRadius: '20px 0 0 20px',
            bgcolor: '#ffffff'
          }
        }}
      >
        <Box sx={{ p: 3, bgcolor: '#134F4D', color: '#ffffff' }}>
          {isAuthenticated && user ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ width: 48, height: 48, bgcolor: user.role === 'doctor' ? '#3b82f6' : '#ec4899', fontSize: '1.2rem', fontWeight: 700 }}>
                {user.firstName?.[0] || 'U'}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                  {user.role === 'doctor' ? `Dr. ${user.firstName} ${user.lastName}` : `${user.firstName} ${user.lastName}`}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', textTransform: 'capitalize' }}>
                  {user.role} Account
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Medizo Health</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Mobile Healthcare Portal</Typography>
            </Box>
          )}
        </Box>

        <List sx={{ pt: 2 }}>
          {isAuthenticated ? (
            <>
              <ListItem button onClick={() => handleNavigation('/dashboard')}>
                <ListItemIcon><LocalHospitalIcon sx={{ color: '#134F4D' }} /></ListItemIcon>
                <ListItemText primary="Dashboard Feed" />
              </ListItem>
              
              <ListItem button onClick={() => handleNavigation('/prescriptions/all')}>
                <ListItemIcon><MedicationIcon sx={{ color: '#134F4D' }} /></ListItemIcon>
                <ListItemText primary={user?.role === 'doctor' ? 'All Prescriptions' : 'My Prescriptions'} />
              </ListItem>
              
              {user?.role === 'doctor' && (
                <ListItem button onClick={() => handleNavigation('/patients')}>
                  <ListItemIcon><VerifiedUserIcon sx={{ color: '#134F4D' }} /></ListItemIcon>
                  <ListItemText primary="Patient Management" />
                </ListItem>
              )}
              
              <ListItem button onClick={() => handleNavigation('/profile')}>
                <ListItemIcon><PersonIcon sx={{ color: '#134F4D' }} /></ListItemIcon>
                <ListItemText primary="My Profile" />
              </ListItem>
              
              <Divider sx={{ my: 1 }} />
              
              <ListItem button onClick={handleLogout}>
                <ListItemIcon><ExitToAppIcon sx={{ color: '#ef4444' }} /></ListItemIcon>
                <ListItemText primary="Logout" sx={{ color: '#ef4444' }} />
              </ListItem>
            </>
          ) : (
            <>
              <ListItem button onClick={() => handleNavigation('/login')}>
                <ListItemIcon><PersonIcon sx={{ color: '#134F4D' }} /></ListItemIcon>
                <ListItemText primary="Login" />
              </ListItem>
              <ListItem button onClick={() => handleNavigation('/register')}>
                <ListItemIcon><SecurityIcon sx={{ color: '#134F4D' }} /></ListItemIcon>
                <ListItemText primary="Register Account" />
              </ListItem>
            </>
          )}
        </List>
      </Drawer>
    </>
  );
};

export default Header;
