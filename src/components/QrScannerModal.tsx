'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  SwitchCamera as SwitchCameraIcon,
  ImageSearch as ImageSearchIcon,
  Shield as ShieldIcon
} from '@mui/icons-material';

interface QrScannerModalProps {
  open: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
}

// Check if native BarcodeDetector is available
const hasBarcodeDetector = typeof window !== 'undefined' && 'BarcodeDetector' in window;

export default function QrScannerModal({ open, onClose, onScanSuccess }: QrScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const detectorRef = useRef<any>(null);
  const jsQRRef = useRef<any>(null);
  const scanningRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [hasCamera, setHasCamera] = useState(true);
  const [decoderReady, setDecoderReady] = useState(false);
  const [scanLinePos, setScanLinePos] = useState(0);
  const [imageDecoding, setImageDecoding] = useState(false);

  // Initialize the QR decoder (native BarcodeDetector or jsQR fallback)
  const initDecoder = useCallback(async () => {
    if (hasBarcodeDetector) {
      try {
        detectorRef.current = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
        setDecoderReady(true);
        console.log('[QR Scanner] Using native BarcodeDetector API');
        return;
      } catch (e) {
        console.warn('[QR Scanner] BarcodeDetector init failed, falling back to jsQR');
      }
    }

    // Fallback: load jsQR
    try {
      const jsQRModule = await import('jsqr');
      jsQRRef.current = jsQRModule.default || jsQRModule;
      setDecoderReady(true);
      console.log('[QR Scanner] Using jsQR fallback decoder');
    } catch (e) {
      console.error('[QR Scanner] Failed to load jsQR:', e);
      setError('QR decoder failed to load. Please use manual entry.');
    }
  }, []);

  // Decode a single canvas frame
  const decodeFrame = useCallback(async (canvas: HTMLCanvasElement): Promise<string | null> => {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx || canvas.width === 0 || canvas.height === 0) return null;

    // Try native BarcodeDetector first
    if (detectorRef.current) {
      try {
        const barcodes = await detectorRef.current.detect(canvas);
        if (barcodes && barcodes.length > 0) {
          return barcodes[0].rawValue;
        }
      } catch (e) {
        // Silently fail — will retry next frame
      }
      return null;
    }

    // Fallback: jsQR
    if (jsQRRef.current) {
      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQRRef.current(imageData.data, canvas.width, canvas.height, {
          inversionAttempts: 'dontInvert',
        });
        if (code && code.data) {
          return code.data;
        }
      } catch (e) {
        // Silently fail
      }
    }

    return null;
  }, []);

  // Start camera and scanning loop
  const startScanner = useCallback(async () => {
    setError('');

    // Ensure decoder is ready
    if (!decoderReady) {
      await initDecoder();
    }

    try {
      // Request camera access
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Check torch support
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = videoTrack.getCapabilities?.() as any;
        if (capabilities?.torch) {
          setTorchSupported(true);
        } else {
          setTorchSupported(false);
        }
      }

      // Attach stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setScanning(true);
      scanningRef.current = true;

      // Start the scan loop
      const scanLoop = async () => {
        if (!scanningRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || video.readyState < 2) {
          animFrameRef.current = requestAnimationFrame(scanLoop);
          return;
        }

        // Draw current video frame to canvas
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }

        // Attempt decode
        const result = await decodeFrame(canvas);
        if (result) {
          console.log('[QR Scanner] ✅ Decoded:', result);

          // Haptic feedback
          if (navigator.vibrate) {
            navigator.vibrate(200);
          }

          // Stop scanning and report result
          stopScanner();
          onScanSuccess(result);
          return;
        }

        // Continue scanning
        if (scanningRef.current) {
          animFrameRef.current = requestAnimationFrame(scanLoop);
        }
      };

      animFrameRef.current = requestAnimationFrame(scanLoop);
    } catch (err: any) {
      console.error('[QR Scanner] Camera error:', err);
      setScanning(false);
      scanningRef.current = false;

      if (err.name === 'NotAllowedError' || err.toString().includes('Permission')) {
        setError('Camera permission denied. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError' || err.toString().includes('no camera')) {
        setError('No camera found on this device. Use manual entry or upload a QR image.');
        setHasCamera(false);
      } else if (err.name === 'NotReadableError') {
        setError('Camera is in use by another app. Close other camera apps and try again.');
      } else {
        setError(`Camera error: ${err.message || err.toString()}`);
      }
    }
  }, [cameraFacing, decoderReady, initDecoder, decodeFrame, onScanSuccess]);

  // Stop camera and scanning
  const stopScanner = useCallback(() => {
    scanningRef.current = false;
    setScanning(false);

    // Cancel animation frame
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = 0;
    }

    // Stop all media tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Detach video source
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setTorchOn(false);
  }, []);

  // Toggle flashlight / torch
  const toggleTorch = useCallback(async () => {
    if (!streamRef.current) return;
    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (!videoTrack) return;

    try {
      const newTorchState = !torchOn;
      await videoTrack.applyConstraints({
        advanced: [{ torch: newTorchState } as any],
      });
      setTorchOn(newTorchState);
    } catch (e) {
      console.warn('[QR Scanner] Torch toggle failed:', e);
    }
  }, [torchOn]);

  // Switch front/back camera
  const switchCamera = useCallback(async () => {
    stopScanner();
    setCameraFacing(prev => (prev === 'environment' ? 'user' : 'environment'));
  }, [stopScanner]);

  // Decode QR from an uploaded image file (client-side only)
  const handleImageUpload = useCallback(async (file: File) => {
    setImageDecoding(true);
    setError('');

    try {
      // Ensure decoder is ready
      if (!decoderReady) {
        await initDecoder();
      }

      // Create an image bitmap from the file
      const imageBitmap = await createImageBitmap(file);

      // Draw it to an offscreen canvas
      const canvas = document.createElement('canvas');
      canvas.width = imageBitmap.width;
      canvas.height = imageBitmap.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error('Could not create canvas context');
      ctx.drawImage(imageBitmap, 0, 0);

      // Try decoding
      const result = await decodeFrame(canvas);

      if (result) {
        console.log('[QR Scanner] ✅ Image decoded:', result);
        if (navigator.vibrate) navigator.vibrate(200);
        onScanSuccess(result);
        handleClose();
      } else {
        setError('No QR code found in the image. Try a clearer photo or use manual entry.');
      }

      imageBitmap.close();
    } catch (err: any) {
      console.error('[QR Scanner] Image decode error:', err);
      setError('Failed to process image. Please try another image or use manual entry.');
    } finally {
      setImageDecoding(false);
    }
  }, [decoderReady, initDecoder, decodeFrame, onScanSuccess]);

  // Manual code submission
  const handleManualSubmit = useCallback(() => {
    if (manualCode.trim()) {
      stopScanner();
      onScanSuccess(manualCode.trim());
      setManualCode('');
    }
  }, [manualCode, stopScanner, onScanSuccess]);

  // Close handler
  const handleClose = useCallback(() => {
    stopScanner();
    setError('');
    setManualCode('');
    setImageDecoding(false);
    onClose();
  }, [stopScanner, onClose]);

  // Initialize decoder on mount
  useEffect(() => {
    initDecoder();
  }, [initDecoder]);

  // Start scanner when dialog opens
  useEffect(() => {
    if (open && hasCamera && decoderReady) {
      const timer = setTimeout(() => {
        startScanner();
      }, 200); // Minimal delay for DOM readiness
      return () => clearTimeout(timer);
    }
    return () => {
      stopScanner();
    };
  }, [open, cameraFacing, decoderReady]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  // Scan line animation
  useEffect(() => {
    if (!scanning) return;
    let pos = 0;
    let direction = 1;
    const interval = setInterval(() => {
      pos += direction * 2;
      if (pos >= 100) direction = -1;
      if (pos <= 0) direction = 1;
      setScanLinePos(pos);
    }, 30);
    return () => clearInterval(interval);
  }, [scanning]);

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
          border: '1px solid rgba(13, 148, 136, 0.35)',
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, px: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <QrIcon sx={{ color: '#0D9488', fontSize: 28 }} />
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
          <Alert severity="warning" sx={{ mb: 2, borderRadius: '14px', bgcolor: 'rgba(13, 148, 136, 0.15)', color: '#2DD4BF' }}>
            {error}
          </Alert>
        )}

        {/* Camera Viewfinder */}
        {hasCamera && (
          <Box sx={{ position: 'relative', mb: 2 }}>
            <Box
              sx={{
                width: '100%',
                minHeight: 280,
                borderRadius: '20px',
                overflow: 'hidden',
                bgcolor: '#1A2C28',
                border: scanning ? '2px solid #0D9488' : '2px dashed rgba(255,255,255,0.15)',
                position: 'relative',
              }}
            >
              {/* Video element — direct camera feed */}
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                style={{
                  width: '100%',
                  height: '100%',
                  minHeight: 280,
                  objectFit: 'cover',
                  borderRadius: '18px',
                  display: scanning ? 'block' : 'none',
                }}
              />

              {/* Hidden canvas for frame processing */}
              <canvas ref={canvasRef} style={{ display: 'none' }} />

              {/* Scanning overlay with animated laser line */}
              {scanning && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    pointerEvents: 'none',
                    borderRadius: '18px',
                  }}
                >
                  {/* Corner markers */}
                  <Box sx={{
                    position: 'absolute',
                    top: '15%', left: '15%', right: '15%', bottom: '15%',
                    border: 'none',
                    '&::before, &::after': {
                      content: '""',
                      position: 'absolute',
                      width: '24px',
                      height: '24px',
                    },
                  }}>
                    {/* Top-left corner */}
                    <Box sx={{
                      position: 'absolute', top: 0, left: 0,
                      width: 28, height: 28,
                      borderTop: '3px solid #0D9488',
                      borderLeft: '3px solid #0D9488',
                      borderRadius: '4px 0 0 0',
                    }} />
                    {/* Top-right corner */}
                    <Box sx={{
                      position: 'absolute', top: 0, right: 0,
                      width: 28, height: 28,
                      borderTop: '3px solid #0D9488',
                      borderRight: '3px solid #0D9488',
                      borderRadius: '0 4px 0 0',
                    }} />
                    {/* Bottom-left corner */}
                    <Box sx={{
                      position: 'absolute', bottom: 0, left: 0,
                      width: 28, height: 28,
                      borderBottom: '3px solid #0D9488',
                      borderLeft: '3px solid #0D9488',
                      borderRadius: '0 0 0 4px',
                    }} />
                    {/* Bottom-right corner */}
                    <Box sx={{
                      position: 'absolute', bottom: 0, right: 0,
                      width: 28, height: 28,
                      borderBottom: '3px solid #0D9488',
                      borderRight: '3px solid #0D9488',
                      borderRadius: '0 0 4px 0',
                    }} />

                    {/* Animated scan line */}
                    <Box
                      sx={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: `${scanLinePos}%`,
                        height: '2px',
                        background: 'linear-gradient(90deg, transparent, #0D9488 20%, #2DD4BF 50%, #0D9488 80%, transparent)',
                        boxShadow: '0 0 12px rgba(13, 148, 136, 0.6), 0 0 24px rgba(13, 148, 136, 0.3)',
                        transition: 'top 0.03s linear',
                      }}
                    />
                  </Box>
                </Box>
              )}

              {/* Starting camera placeholder */}
              {!scanning && hasCamera && !error && (
                <Box sx={{
                  position: 'absolute',
                  top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                }}>
                  <CircularProgress size={36} sx={{ color: '#0D9488', mb: 1.5 }} />
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>
                    Starting camera...
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Camera Controls Overlay */}
            {scanning && (
              <Box sx={{
                position: 'absolute',
                bottom: 12,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: 1.5,
                zIndex: 10,
              }}>
                {torchSupported && (
                  <IconButton
                    onClick={toggleTorch}
                    sx={{
                      bgcolor: torchOn ? '#0D9488' : 'rgba(0,0,0,0.6)',
                      color: torchOn ? '#FFFFFF' : '#FAF2F5',
                      backdropFilter: 'blur(10px)',
                      '&:hover': { bgcolor: torchOn ? '#14B8A6' : 'rgba(0,0,0,0.8)' },
                    }}
                  >
                    {torchOn ? <FlashOnIcon /> : <FlashOffIcon />}
                  </IconButton>
                )}
                <IconButton
                  onClick={switchCamera}
                  sx={{
                    bgcolor: 'rgba(0,0,0,0.6)',
                    color: '#FAF2F5',
                    backdropFilter: 'blur(10px)',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
                  }}
                >
                  <SwitchCameraIcon />
                </IconButton>
              </Box>
            )}
          </Box>
        )}

        {/* Scan Status */}
        {scanning && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
            <CircularProgress size={16} sx={{ color: '#0D9488' }} />
            <Typography variant="body2" sx={{ fontWeight: 800, color: '#2DD4BF' }}>
              Point camera at QR code on prescription...
            </Typography>
          </Box>
        )}

        {/* Camera Start/Restart + Upload Buttons */}
        {!scanning && hasCamera && (
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={startScanner}
              startIcon={<CameraIcon />}
              sx={{
                borderRadius: '14px',
                fontWeight: 800,
                borderColor: '#0D9488',
                color: '#0D9488',
                '&:hover': { borderColor: '#14B8A6', bgcolor: 'rgba(13, 148, 136, 0.15)' },
              }}
            >
              {error ? 'Retry Camera' : 'Start Camera'}
            </Button>
            <Button
              variant="outlined"
              component="label"
              startIcon={imageDecoding ? <CircularProgress size={18} color="inherit" /> : <ImageSearchIcon />}
              disabled={imageDecoding}
              sx={{
                borderRadius: '14px',
                fontWeight: 800,
                borderColor: 'rgba(255,255,255,0.2)',
                color: 'rgba(255,255,255,0.7)',
                minWidth: 140,
                '&:hover': { borderColor: '#0D9488', bgcolor: 'rgba(13, 148, 136, 0.15)' },
              }}
            >
              {imageDecoding ? 'Decoding...' : 'Upload QR'}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleImageUpload(file);
                  }
                  // Reset so same file can be re-selected
                  e.target.value = '';
                }}
              />
            </Button>
          </Box>
        )}

        {/* Upload button when scanning is active */}
        {scanning && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
            <Button
              variant="text"
              component="label"
              startIcon={imageDecoding ? <CircularProgress size={14} color="inherit" /> : <ImageSearchIcon />}
              disabled={imageDecoding}
              size="small"
              sx={{
                color: 'rgba(255,255,255,0.5)',
                fontSize: '0.75rem',
                fontWeight: 700,
                '&:hover': { color: '#2DD4BF' },
              }}
            >
              {imageDecoding ? 'Decoding...' : 'Or upload QR image instead'}
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleImageUpload(file);
                  }
                  e.target.value = '';
                }}
              />
            </Button>
          </Box>
        )}

        <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }}>
          <Chip
            label="OR ENTER MANUALLY"
            size="small"
            sx={{
              fontWeight: 800,
              fontSize: '0.65rem',
              color: 'rgba(255,255,255,0.5)',
              bgcolor: 'transparent',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
          />
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
                  <SearchIcon sx={{ color: '#0D9488' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: '#FAF2F5',
                bgcolor: 'rgba(255,255,255,0.05)',
                borderRadius: '14px',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
                '&:hover fieldset': { borderColor: '#0D9488' },
                '&.Mui-focused fieldset': { borderColor: '#0D9488' },
              },
            }}
          />
          <Button
            variant="contained"
            onClick={handleManualSubmit}
            disabled={!manualCode.trim()}
            sx={{
              borderRadius: '14px',
              fontWeight: 800,
              bgcolor: '#0D9488',
              color: '#FFFFFF',
              minWidth: 80,
              '&:hover': { bgcolor: '#0F766E' },
              '&.Mui-disabled': { bgcolor: 'rgba(13, 148, 136, 0.3)', color: 'rgba(255, 255, 255, 0.5)' },
            }}
          >
            Lookup
          </Button>
        </Box>

        {/* Security & Verification Trust Badge */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 2 }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.8,
              py: 0.6,
              px: 1.6,
              borderRadius: '20px',
              bgcolor: 'rgba(13, 148, 136, 0.14)',
              border: '1px solid rgba(45, 212, 191, 0.3)',
            }}
          >
            <ShieldIcon sx={{ fontSize: 15, color: '#2DD4BF' }} />
            <Typography variant="caption" sx={{ color: '#2DD4BF', fontWeight: 800, fontSize: '0.72rem', letterSpacing: 0.4 }}>
              Encrypted Digital Rx Verification
            </Typography>
          </Box>
        </Box>

        {/* Help Guidance Text */}
        <Typography
          variant="caption"
          sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', textAlign: 'center', mt: 1, lineHeight: 1.5, fontSize: '0.75rem' }}
        >
          Align the camera with the official prescription QR code, or paste the Rx identifier to verify dispensing history.
        </Typography>
      </DialogContent>
    </Dialog>
  );
}
