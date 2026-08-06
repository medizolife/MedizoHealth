import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  CircularProgress,
  Alert,
  IconButton,
  Chip,
  Paper
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Close as CloseIcon,
  Description as FileIcon,
  PictureAsPdf as PdfIcon,
  InsertDriveFile as ImageDocIcon,
  CheckCircle as SuccessIcon
} from '@mui/icons-material';
import { prescriptionsAPI } from '../services/api';

interface UploadPastPrescriptionModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  patientId?: string; // Optional if doctor is uploading for a patient
}

const UploadPastPrescriptionModal: React.FC<UploadPastPrescriptionModalProps> = ({
  open,
  onClose,
  onSuccess,
  patientId
}) => {
  const [title, setTitle] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [recordDate, setRecordDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Hard backend limit is 3MB, but UI instructs 2MB limit as requested
  const UI_MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError(null);
    setErrorMessage(null);

    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    // Client-side file size check (warns user at 2 MB limit)
    if (file.size > UI_MAX_SIZE_BYTES) {
      setFileError(`File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds the 2 MB limit. Please select a smaller file.`);
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    setSelectedFile(file);

    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Please enter a title for the prescription record.');
      return;
    }
    if (!selectedFile) {
      setErrorMessage('Please select a prescription document file (image or PDF) to upload.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', title.trim());
      if (doctorName.trim()) formData.append('doctorName', doctorName.trim());
      if (recordDate) formData.append('recordDate', recordDate);
      if (notes.trim()) formData.append('notes', notes.trim());
      if (patientId) formData.append('patientId', patientId);

      await prescriptionsAPI.uploadExternalPrescription(formData);
      setSuccessMessage('Past prescription uploaded successfully!');
      
      setTimeout(() => {
        handleClose();
        onSuccess();
      }, 1200);
    } catch (err: any) {
      console.error('Upload past prescription error:', err);
      const msg = err.response?.data?.message || 'Failed to upload prescription. Please try again.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setDoctorName('');
    setRecordDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setFileError(null);
    setErrorMessage(null);
    setSuccessMessage(null);
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
          borderRadius: '24px',
          p: 1
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ p: 1, bgcolor: 'rgba(19, 79, 77, 0.1)', borderRadius: '12px', color: '#134F4D', display: 'flex' }}>
            <UploadIcon />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
            Upload Past Prescription
          </Typography>
        </Box>
        <IconButton onClick={handleClose} disabled={loading}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent dividers sx={{ borderColor: '#f1f5f9' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            Upload external or old prescription records (from other hospitals or clinics) so your attending doctor has a complete medical history.
          </Typography>

          {errorMessage && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }}>
              {errorMessage}
            </Alert>
          )}

          {successMessage && (
            <Alert icon={<SuccessIcon />} severity="success" sx={{ mb: 2, borderRadius: '12px' }}>
              {successMessage}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Prescription / Hospital Title *"
              placeholder="e.g. City Clinic Checkup, Past Blood Test & Rx"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              required
              variant="outlined"
              size="small"
              disabled={loading}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                label="Doctor / Clinic Name"
                placeholder="e.g. Dr. A. K. Sharma"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                sx={{ flex: 1, minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                size="small"
                disabled={loading}
              />

              <TextField
                label="Prescription Date *"
                type="date"
                value={recordDate}
                onChange={(e) => setRecordDate(e.target.value)}
                sx={{ width: 180, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                size="small"
                InputLabelProps={{ shrink: true }}
                required
                disabled={loading}
              />
            </Box>

            <TextField
              label="Medications & Notes (Optional)"
              placeholder="List prescribed medicines, dosage, or relevant doctor instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              multiline
              rows={2}
              fullWidth
              size="small"
              disabled={loading}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />

            {/* File Upload Box */}
            <Paper
              variant="outlined"
              sx={{
                p: 2.5,
                borderRadius: '16px',
                textAlign: 'center',
                bgcolor: selectedFile ? '#f8fafc' : '#ffffff',
                border: fileError ? '2px dashed #ef4444' : '2px dashed rgba(19, 79, 77, 0.3)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: '#134F4D',
                  bgcolor: 'rgba(19, 79, 77, 0.02)'
                }
              }}
              component="label"
            >
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                disabled={loading}
              />

              {previewUrl ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <Box
                    component="img"
                    src={previewUrl}
                    alt="Prescription Preview"
                    sx={{ maxHeight: 140, borderRadius: '12px', border: '1px solid #e2e8f0', objectFit: 'contain' }}
                  />
                  <Chip
                    label={`${selectedFile?.name} (${((selectedFile?.size || 0) / 1024).toFixed(0)} KB)`}
                    size="small"
                    color="primary"
                    sx={{ fontWeight: 700 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Click to change file
                  </Typography>
                </Box>
              ) : selectedFile ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  {selectedFile.type === 'application/pdf' ? (
                    <PdfIcon sx={{ fontSize: 44, color: '#dc2626' }} />
                  ) : (
                    <ImageDocIcon sx={{ fontSize: 44, color: '#134F4D' }} />
                  )}
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                    {selectedFile.name}
                  </Typography>
                  <Chip
                    label={`${((selectedFile.size || 0) / (1024 * 1024)).toFixed(2)} MB`}
                    size="small"
                    sx={{ fontWeight: 700, bgcolor: '#e2e8f0' }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Click to change file
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <UploadIcon sx={{ fontSize: 40, color: '#134F4D' }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#134F4D' }}>
                    Click or Drag to Upload Prescription File
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Allowed formats: JPG, PNG, WEBP, PDF (Max file size: 2 MB)
                  </Typography>
                </Box>
              )}
            </Paper>

            {fileError && (
              <Alert severity="warning" sx={{ borderRadius: '12px', py: 0.5 }}>
                {fileError}
              </Alert>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClose} disabled={loading} sx={{ borderRadius: '12px', textTransform: 'none', color: '#64748b' }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !selectedFile || !title.trim()}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <UploadIcon />}
            sx={{
              borderRadius: '12px',
              bgcolor: '#134F4D',
              color: '#ffffff',
              fontWeight: 800,
              px: 3,
              py: 1,
              '&:hover': { bgcolor: '#0e3b3a' }
            }}
          >
            {loading ? 'Uploading Record...' : 'Upload Past Prescription'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default UploadPastPrescriptionModal;
