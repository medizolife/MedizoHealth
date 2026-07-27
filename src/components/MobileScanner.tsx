'use client';
import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  IconButton, 
  Dialog, 
  DialogContent,
  CircularProgress
} from '@mui/material';
import { QrCodeScanner as ScannerIcon, Close as CloseIcon, CameraAlt as CameraIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface MobileScannerProps {
  open: boolean;
  onClose: () => void;
}

const MobileScanner: React.FC<MobileScannerProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [demoSuccess, setDemoSuccess] = useState(false);

  const startScanner = () => {
    setScanning(true);
    // Simulate camera scan result after 2 seconds
    setTimeout(() => {
      setScanning(false);
      setDemoSuccess(true);
    }, 2000);
  };

  const handleScannedResult = () => {
    onClose();
    navigate('/prescriptions/all');
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      fullWidth 
      maxWidth="xs"
      PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#134F4D', display: 'flex', alignItems: 'center', gap: 1 }}>
          <ScannerIcon /> Scan QR Prescription
        </Typography>
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </Box>

      <DialogContent sx={{ p: 2, textAlign: 'center' }}>
        <Paper 
          variant="outlined" 
          sx={{ 
            height: 240, 
            borderRadius: '20px', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            bgcolor: '#0f172a',
            color: '#fff',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {scanning ? (
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress sx={{ color: '#4ade80', mb: 2 }} />
              <Typography variant="body2">Scanning camera feed...</Typography>
            </Box>
          ) : demoSuccess ? (
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="subtitle1" sx={{ color: '#4ade80', fontWeight: 700, mb: 1 }}>
                ✅ Prescription Verification Found!
              </Typography>
              <Button variant="contained" onClick={handleScannedResult} sx={{ bgcolor: '#4ade80', color: '#0f172a', fontWeight: 700 }}>
                View Verified Prescription
              </Button>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <CameraIcon sx={{ fontSize: 48, color: '#94a3b8', mb: 1 }} />
              <Typography variant="body2" sx={{ color: '#cbd5e1', mb: 2 }}>
                Point smartphone camera at prescription QR code
              </Typography>
              <Button 
                variant="contained" 
                onClick={startScanner}
                sx={{ bgcolor: '#134F4D', color: '#fff', fontWeight: 700 }}
              >
                Activate Camera
              </Button>
            </Box>
          )}
        </Paper>
      </DialogContent>
    </Dialog>
  );
};

export default MobileScanner;
