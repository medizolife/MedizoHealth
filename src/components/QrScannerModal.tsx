'use client';
import React, { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  Alert,
  CircularProgress,
  Chip,
  Divider
} from '@mui/material';
import {
  Close as CloseIcon,
  CameraAlt as CameraIcon,
  QrCodeScanner as QrIcon,
  FlashlightOn as FlashOnIcon,
  FlashlightOff as FlashOffIcon,
  Search as SearchIcon,
  SwitchCamera as SwitchCameraIcon
} from '@mui/icons-material';

interface QrScannerModalProps {
  open: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
}

export default function QrScannerModal({ open, onClose, onScanSuccess }: QrScannerModalProps) {
  const scannerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [torchOn, setTorchOn] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [hasCamera, setHasCamera] = useState(true);

  const startScanner = async () => {
    setError('');
    setScanning(true);
    
    try {
      // Dynamically import html5-qrcode to avoid SSR issues
      const { Html5Qrcode } = await import('html5-qrcode');
      
      // Clean up any existing scanner
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
          scannerRef.current.clear();
        } catch (e) { /* ignore cleanup errors */ }
      }

      const scannerId = 'qr-scanner-container';
      
      // Make sure the DOM element exists
      if (!document.getElementById(scannerId)) {
        setError('Scanner container not ready. Please try again.');
        setScanning(false);
        return;
      }

      const scanner = new Html5Qrcode(scannerId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: cameraFacing },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText: string) => {
          console.log('[QR Scanner] Decoded:', decodedText);
          // Stop scanner on successful scan
          scanner.stop().then(() => {
            scanner.clear();
            scannerRef.current = null;
            setScanning(false);
            onScanSuccess(decodedText);
          }).catch(() => {
            onScanSuccess(decodedText);
          });
        },
        () => {
          // QR code not found in this frame - ignore
        }
      );
    } catch (err: any) {
      console.error('[QR Scanner] Error:', err);
      setScanning(false);
      if (err.toString().includes('NotAllowedError') || err.toString().includes('Permission')) {
        setError('Camera permission denied. Please allow camera access in your browser settings.');
      } else if (err.toString().includes('NotFoundError') || err.toString().includes('no camera')) {
        setError('No camera found on this device. Use the manual entry field below.');
        setHasCamera(false);
      } else {
        setError(`Camera error: ${err.message || err.toString()}`);
      }
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) { /* ignore */ }
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const toggleTorch = async () => {
    if (scannerRef.current) {
      try {
        const capabilities = scannerRef.current.getRunningTrackCameraCapabilities?.();
        if (capabilities?.torchFeature?.isSupported()) {
          await capabilities.torchFeature.apply(!torchOn);
          setTorchOn(!torchOn);
        }
      } catch (e) {
        console.log('[QR Scanner] Torch not supported');
      }
    }
  };

  const switchCamera = async () => {
    await stopScanner();
    setCameraFacing(prev => prev === 'environment' ? 'user' : 'environment');
    // Camera will restart via useEffect
  };

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      stopScanner();
      onScanSuccess(manualCode.trim());
      setManualCode('');
    }
  };

  // Start scanner when dialog opens
  useEffect(() => {
    if (open && hasCamera) {
      // Small delay to ensure DOM is rendered
      const timer = setTimeout(() => {
        startScanner();
      }, 500);
      return () => clearTimeout(timer);
    }
    return () => {
      stopScanner();
    };
  }, [open, cameraFacing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const handleClose = () => {
    stopScanner();
    setError('');
    setManualCode('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '28px',
          bgcolor: '#0B1315',
          color: '#FAF2F5',
          overflow: 'hidden',
          border: '1px solid rgba(245, 158, 11, 0.3)'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, px: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <QrIcon sx={{ color: '#F59E0B', fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 900, fontSize: '1.1rem' }}>
            Scan Prescription QR
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon sx={{ color: '#FAF2F5' }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 2.5, pb: 3 }}>
        {error && (
          <Alert severity="warning" sx={{ mb: 2, borderRadius: '14px', bgcolor: 'rgba(245, 158, 11, 0.15)', color: '#FBBF24' }}>
            {error}
          </Alert>
        )}

        {/* Camera Viewfinder */}
        {hasCamera && (
          <Box sx={{ position: 'relative', mb: 2 }}>
            <Box
              id="qr-scanner-container"
              ref={containerRef}
              sx={{
                width: '100%',
                minHeight: 280,
                borderRadius: '20px',
                overflow: 'hidden',
                bgcolor: '#1A2C28',
                border: scanning ? '2px solid #F59E0B' : '2px dashed rgba(255,255,255,0.15)',
                '& video': {
                  borderRadius: '18px !important'
                },
                '& #qr-shaded-region': {
                  borderWidth: '3px !important'
                }
              }}
            />

            {/* Camera Controls Overlay */}
            {scanning && (
              <Box sx={{
                position: 'absolute',
                bottom: 12,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: 1.5,
                zIndex: 10
              }}>
                <IconButton
                  onClick={toggleTorch}
                  sx={{
                    bgcolor: torchOn ? '#F59E0B' : 'rgba(0,0,0,0.6)',
                    color: torchOn ? '#0B1315' : '#FAF2F5',
                    backdropFilter: 'blur(10px)',
                    '&:hover': { bgcolor: torchOn ? '#FBBF24' : 'rgba(0,0,0,0.8)' }
                  }}
                >
                  {torchOn ? <FlashOnIcon /> : <FlashOffIcon />}
                </IconButton>
                <IconButton
                  onClick={switchCamera}
                  sx={{
                    bgcolor: 'rgba(0,0,0,0.6)',
                    color: '#FAF2F5',
                    backdropFilter: 'blur(10px)',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' }
                  }}
                >
                  <SwitchCameraIcon />
                </IconButton>
              </Box>
            )}

            {/* Scanning Indicator */}
            {!scanning && hasCamera && !error && (
              <Box sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center'
              }}>
                <CameraIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.3)', mb: 1 }} />
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>
                  Starting camera...
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Scan Status */}
        {scanning && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
            <CircularProgress size={16} sx={{ color: '#F59E0B' }} />
            <Typography variant="body2" sx={{ fontWeight: 800, color: '#FBBF24' }}>
              Point camera at QR code on prescription...
            </Typography>
          </Box>
        )}

        {/* Camera Start/Restart Button */}
        {!scanning && hasCamera && (
          <Button
            fullWidth
            variant="outlined"
            onClick={startScanner}
            startIcon={<CameraIcon />}
            sx={{
              mb: 2,
              borderRadius: '14px',
              fontWeight: 800,
              borderColor: '#F59E0B',
              color: '#F59E0B',
              '&:hover': { borderColor: '#FBBF24', bgcolor: 'rgba(245, 158, 11, 0.1)' }
            }}
          >
            {error ? 'Retry Camera Scan' : 'Start Camera Scan'}
          </Button>
        )}

        <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }}>
          <Chip label="OR ENTER MANUALLY" size="small" sx={{ fontWeight: 800, fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', bgcolor: 'transparent', border: '1px solid rgba(255,255,255,0.15)' }} />
        </Divider>

        {/* Manual Entry */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            placeholder="Paste QR code text, Rx ID, or prescription ID..."
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleManualSubmit(); }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#F59E0B' }} />
                </InputAdornment>
              )
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: '#FAF2F5',
                bgcolor: 'rgba(255,255,255,0.05)',
                borderRadius: '14px',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
                '&:hover fieldset': { borderColor: '#F59E0B' },
                '&.Mui-focused fieldset': { borderColor: '#F59E0B' }
              }
            }}
          />
          <Button
            variant="contained"
            onClick={handleManualSubmit}
            disabled={!manualCode.trim()}
            sx={{
              borderRadius: '14px',
              fontWeight: 800,
              bgcolor: '#F59E0B',
              color: '#0B1315',
              minWidth: 80,
              '&:hover': { bgcolor: '#FBBF24' },
              '&.Mui-disabled': { bgcolor: 'rgba(245, 158, 11, 0.3)', color: 'rgba(11, 19, 21, 0.5)' }
            }}
          >
            Lookup
          </Button>
        </Box>

        {/* Help Text */}
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'block', textAlign: 'center', mt: 1.5, lineHeight: 1.5 }}>
          Scan the QR code on a printed or digital prescription, or manually enter the prescription ID / QR code string.
        </Typography>
      </DialogContent>
    </Dialog>
  );
}
