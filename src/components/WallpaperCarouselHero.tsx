'use client';
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Avatar, 
  Chip, 
  IconButton, 
  Button, 
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Search as SearchIcon,
  Verified as VerifiedIcon,
  MedicalServices as StethoscopeIcon,
  LocalPharmacy as PharmacyIcon,
  QrCodeScanner as QrScannerIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useThemeContext } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';

export interface WallpaperPhoto {
  id: string;
  name: string;
  emoji: string;
  imageUrl: string;
  gradientOverlay: string;
}

export const PHOTOGRAPHIC_WALLPAPERS: WallpaperPhoto[] = [
  {
    id: 'rainy-forest',
    name: 'Rainy Foggy Forest',
    emoji: '🌲',
    imageUrl: '/wallpapers/rainy_foggy_forest.png',
    gradientOverlay: 'linear-gradient(180deg, rgba(11, 26, 20, 0.4) 0%, rgba(11, 26, 20, 0.78) 100%)'
  },
  {
    id: 'foggy-mountain',
    name: 'Misty Mountain Peaks',
    emoji: '🌄',
    imageUrl: '/wallpapers/foggy_mountain_peaks.png',
    gradientOverlay: 'linear-gradient(180deg, rgba(15, 23, 42, 0.4) 0%, rgba(15, 23, 42, 0.78) 100%)'
  },
  {
    id: 'rainy-window',
    name: 'Rainy Window Lights',
    emoji: '🌧️',
    imageUrl: '/wallpapers/rainy_window_city.png',
    gradientOverlay: 'linear-gradient(180deg, rgba(20, 16, 32, 0.4) 0%, rgba(20, 16, 32, 0.78) 100%)'
  }
];

interface WallpaperCarouselHeroProps {
  title?: string;
  subtitle?: string;
  showSearch?: boolean;
  showCreateButton?: boolean;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  onQrScanClick?: () => void;
}

export default function WallpaperCarouselHero({
  title,
  subtitle,
  showSearch = true,
  showCreateButton = false,
  searchQuery = '',
  onSearchChange,
  onQrScanClick
}: WallpaperCarouselHeroProps) {
  const { authState } = useAuth();
  const { user } = authState;
  const navigate = useNavigate();

  const [currentIndex, setCurrentIndex] = useState(0);

  // Seamless auto-advance photographic wallpapers every 7 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % PHOTOGRAPHIC_WALLPAPERS.length);
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  const activePhoto = PHOTOGRAPHIC_WALLPAPERS[currentIndex];

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  return (
    <Paper
      className="specular-sheen"
      sx={{
        p: { xs: 2.2, sm: 3.2 },
        mb: 3,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: { xs: '24px !important', sm: '32px !important' },
        backgroundImage: `url('${activePhoto.imageUrl}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        transition: 'background-image 1.2s ease-in-out',
        boxShadow: '0 20px 48px rgba(0, 0, 0, 0.28)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        contain: 'paint layout',
        transform: 'translateZ(0)'
      }}
    >
      {/* ─── REALISTIC ANIMATED FOG DRIFT LAYER ─── */}
      <Box 
        sx={{ 
          position: 'absolute', 
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 30%, rgba(255, 255, 255, 0.18) 0%, transparent 75%)',
          animation: 'fogDrift 18s ease-in-out infinite alternate',
          pointerEvents: 'none',
          zIndex: 1,
          '@keyframes fogDrift': {
            '0%': { transform: 'translateX(-8%) translateY(-3%) scale(1)' },
            '100%': { transform: 'translateX(8%) translateY(3%) scale(1.08)' }
          }
        }} 
      />

      {/* ─── REALISTIC ANIMATED RAIN DROPLET LAYER ─── */}
      <Box 
        sx={{ 
          position: 'absolute', 
          inset: 0,
          backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.12) 0px, rgba(255,255,255,0.12) 2px, transparent 2px, transparent 24px)',
          backgroundSize: '100% 60px',
          animation: 'rainFall 0.8s linear infinite',
          pointerEvents: 'none',
          opacity: 0.55,
          zIndex: 2,
          '@keyframes rainFall': {
            '0%': { backgroundPosition: '0 0' },
            '100%': { backgroundPosition: '0 60px' }
          }
        }} 
      />

      {/* ─── HIGH-CONTRAST PROTECTIVE GLASS OVERLAY ─── */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: activePhoto.gradientOverlay,
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
          zIndex: 3,
          pointerEvents: 'none',
          transition: 'background 1.2s ease-in-out'
        }}
      />

      {/* Main Hero Content */}
      <Box sx={{ position: 'relative', zIndex: 4 }}>
        
        {/* Top Header Row with User Avatar & Role */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.8 }}>
            <Avatar 
              src={user?.profileImage || ''}
              sx={{ 
                width: { xs: 48, sm: 56 }, 
                height: { xs: 48, sm: 56 }, 
                bgcolor: 'rgba(255, 255, 255, 0.25)', 
                border: '2px solid #ffffff',
                boxShadow: '0 0 20px rgba(255, 255, 255, 0.4)',
                fontWeight: 800
              }}
            >
              {user?.firstName ? user.firstName.charAt(0).toUpperCase() : <StethoscopeIcon />}
            </Avatar>

            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 800, 
                    color: '#ffffff', 
                    letterSpacing: '-0.02em', 
                    fontSize: { xs: '1.15rem', sm: '1.38rem' },
                    textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)'
                  }}
                >
                  {title || (user?.role === 'doctor' ? `Dr. ${user?.lastName || user?.firstName || ''}` : `${user?.firstName || 'User'}`)} 👋
                </Typography>
                {user?.role === 'doctor' && (
                  <Chip 
                    icon={<VerifiedIcon sx={{ fontSize: '14px !important', color: '#66CDAA !important' }} />}
                    label="Doctor"
                    size="small"
                    sx={{ 
                      height: 22, 
                      bgcolor: 'rgba(102, 205, 170, 0.25)', 
                      color: '#A7F3D0', 
                      fontWeight: 800, 
                      fontSize: '0.68rem',
                      border: '1px solid rgba(255, 255, 255, 0.4)',
                      backdropFilter: 'blur(6px)'
                    }} 
                  />
                )}
              </Box>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.92)', 
                  fontSize: '0.825rem',
                  fontWeight: 600,
                  textShadow: '0 1px 6px rgba(0, 0, 0, 0.8)'
                }}
              >
                {subtitle || (user?.role === 'doctor' ? (user?.specialization || 'General Healthcare Practitioner') : 'Personal Medical Portal')}
              </Typography>
            </Box>
          </Box>

          {/* Action Button or Date */}
          {showCreateButton ? (
            <Button
              variant="contained"
              onClick={() => navigate('/prescriptions/new')}
              startIcon={<PharmacyIcon />}
              sx={{
                borderRadius: '20px',
                fontWeight: 800,
                px: 2.5,
                py: 0.9,
                bgcolor: 'rgba(255, 255, 255, 0.95)',
                color: '#123029',
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)',
                '&:hover': { bgcolor: '#ffffff', transform: 'translateY(-2px)' },
                transition: 'all 0.2s ease',
                display: { xs: 'none', sm: 'inline-flex' }
              }}
            >
              Create New Prescription
            </Button>
          ) : (
            <Chip 
              label={currentDate}
              size="small"
              sx={{ 
                bgcolor: 'rgba(255, 255, 255, 0.22)', 
                color: '#ffffff', 
                fontWeight: 800, 
                fontSize: '0.75rem',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.35)',
                display: { xs: 'none', sm: 'flex' }
              }} 
            />
          )}
        </Box>

        {/* Embedded Search Field (If enabled) */}
        {showSearch && (
          <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField 
              fullWidth
              placeholder="Search prescriptions, diagnosis or patients..."
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              variant="outlined"
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#ffffff' }} />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => onSearchChange?.('')} sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      ×
                    </IconButton>
                  </InputAdornment>
                ),
                sx: {
                  bgcolor: 'rgba(0, 0, 0, 0.45)',
                  backdropFilter: 'blur(16px)',
                  borderRadius: '18px',
                  color: '#ffffff !important',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  '& .MuiInputBase-input': {
                    color: '#ffffff !important',
                    WebkitTextFillColor: '#ffffff !important',
                  },
                  '& input': {
                    color: '#ffffff !important',
                    WebkitTextFillColor: '#ffffff !important',
                    caretColor: '#ffffff !important',
                  },
                  '& input::placeholder': { 
                    color: '#ffffff !important', 
                    opacity: '0.95 !important',
                    WebkitTextFillColor: '#ffffff !important',
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: '#ffffff !important',
                    opacity: '0.95 !important',
                    WebkitTextFillColor: '#ffffff !important',
                  },
                  '&:hover fieldset': { borderColor: '#ffffff !important' },
                  '&.Mui-focused fieldset': { borderColor: '#ffffff !important', borderWidth: '1.5px' }
                }
              }}
            />
            {onQrScanClick && (
              <IconButton
                onClick={onQrScanClick}
                sx={{
                  bgcolor: 'rgba(13, 148, 136, 0.5)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.35)',
                  backdropFilter: 'blur(16px)',
                  width: 42,
                  height: 42,
                  flexShrink: 0,
                  '&:hover': { bgcolor: 'rgba(13, 148, 136, 0.7)' }
                }}
              >
                <QrScannerIcon sx={{ fontSize: 22 }} />
              </IconButton>
            )}
          </Box>
        )}

      </Box>
    </Paper>
  );
}
