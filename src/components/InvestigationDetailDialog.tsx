import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  Slide,
  IconButton
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import {
  Close as CloseIcon,
  Science as ScienceIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import { Investigation } from '../types/prescription';

const SlideUp = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// Predefined reason options for the dropdown
const REASON_OPTIONS = [
  'Routine Evaluation',
  'Diagnostic Workup',
  'Follow-up Monitoring',
  'Pre-Operative Assessment',
  'Post-Treatment Review',
  'Screening',
  'Rule Out Differential',
  'Baseline Assessment',
  'Other (specify)'
];

// Fasting options
const FASTING_OPTIONS = [
  'Not Required',
  '2 Hours',
  '4 Hours',
  '6 Hours',
  '8 Hours (Overnight)',
  '12 Hours'
];

interface InvestigationDetailDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (investigation: Investigation) => void;
  /** Pre-filled investigation data (for editing or predefined test selection) */
  initialData?: Investigation;
  /** If true, the test name field is editable (custom test) */
  isCustom?: boolean;
  /** If true, this is editing an existing investigation */
  isEditing?: boolean;
  mode: 'dark' | 'light';
}

const InvestigationDetailDialog: React.FC<InvestigationDetailDialogProps> = ({
  open,
  onClose,
  onConfirm,
  initialData,
  isCustom = false,
  isEditing = false,
  mode
}) => {
  const isDark = mode === 'dark';

  const [testName, setTestName] = useState('');
  const [reason, setReason] = useState('Routine Evaluation');
  const [customReason, setCustomReason] = useState('');
  const [priority, setPriority] = useState('Normal');
  const [fasting, setFasting] = useState('Not Required');
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Reset form when dialog opens with new data
  useEffect(() => {
    if (open && initialData) {
      setTestName(initialData.testName || '');
      // Check if reason matches a predefined option
      const matchedReason = REASON_OPTIONS.find(r => r === initialData.reason);
      if (matchedReason && matchedReason !== 'Other (specify)') {
        setReason(matchedReason);
        setCustomReason('');
      } else if (initialData.reason) {
        setReason('Other (specify)');
        setCustomReason(initialData.reason);
      } else {
        setReason('Routine Evaluation');
        setCustomReason('');
      }
      setPriority(initialData.priority || 'Normal');
      // Match fasting to a predefined option
      const matchedFasting = FASTING_OPTIONS.find(f => f === initialData.fasting);
      setFasting(matchedFasting || initialData.fasting || 'Not Required');
      setSpecialInstructions(initialData.specialInstructions || '');
    } else if (open && !initialData) {
      // Reset for brand new custom test
      setTestName('');
      setReason('Routine Evaluation');
      setCustomReason('');
      setPriority('Normal');
      setFasting('Not Required');
      setSpecialInstructions('');
    }
  }, [open, initialData]);

  const handleConfirm = () => {
    if (!testName.trim()) return;
    const finalReason = reason === 'Other (specify)' ? customReason.trim() || 'Other' : reason;
    onConfirm({
      testName: testName.trim(),
      reason: finalReason,
      priority,
      fasting,
      specialInstructions: specialInstructions.trim() || undefined
    });
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'Urgent': return { bg: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)', border: '#ef4444', text: '#ef4444' };
      case 'Normal': return { bg: isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.1)', border: '#f59e0b', text: '#f59e0b' };
      case 'Routine': return { bg: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)', border: '#22c55e', text: '#22c55e' };
      default: return { bg: 'transparent', border: '#888', text: '#888' };
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={SlideUp}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '24px',
          bgcolor: isDark ? 'rgba(15, 30, 26, 0.97)' : 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          border: isDark ? '1px solid rgba(137, 215, 183, 0.2)' : '1px solid rgba(0, 0, 0, 0.08)',
          boxShadow: isDark
            ? '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(137, 215, 183, 0.08)'
            : '0 20px 60px rgba(0, 0, 0, 0.15)',
          overflow: 'hidden'
        }
      }}
    >
      {/* Header */}
      <DialogTitle sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        pb: 1,
        pt: 2.5,
        px: 3,
        background: isDark
          ? 'linear-gradient(135deg, rgba(20, 50, 40, 0.9), rgba(15, 30, 26, 0.95))'
          : 'linear-gradient(135deg, rgba(240, 255, 248, 0.95), rgba(255, 255, 255, 0.98))',
        borderBottom: isDark ? '1px solid rgba(137, 215, 183, 0.15)' : '1px solid rgba(0, 0, 0, 0.06)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 40,
            height: 40,
            borderRadius: '12px',
            bgcolor: isDark ? 'rgba(137, 215, 183, 0.15)' : 'rgba(66, 132, 117, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ScienceIcon sx={{ color: isDark ? '#89D7B7' : '#428475', fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: isDark ? '#FAF2F5' : '#1A312C', fontSize: '1.05rem', lineHeight: 1.2 }}>
              {isEditing ? 'Edit Investigation' : isCustom ? 'Add Custom Test' : 'Configure Investigation'}
            </Typography>
            <Typography variant="caption" sx={{ color: isDark ? '#89D7B7' : '#428475', fontWeight: 600, fontSize: '0.72rem' }}>
              {isCustom ? 'Enter test name and clinical details' : 'Fill in clinical details for this test'}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: isDark ? '#89D7B7' : '#666' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: '20px !important', px: 3, pb: 1 }}>
        {/* Test Name */}
        <TextField
          fullWidth
          size="small"
          label="Test Name"
          placeholder="e.g., Upper GI Endoscopy, Biopsy"
          value={testName}
          onChange={(e) => setTestName(e.target.value)}
          disabled={!isCustom && !isEditing}
          InputProps={{
            sx: {
              borderRadius: '14px',
              fontWeight: 700,
              fontSize: '0.95rem',
              bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)'
            }
          }}
          sx={{ mb: 2.5 }}
        />

        {/* Clinical Reason */}
        <FormControl fullWidth size="small" sx={{ mb: reason === 'Other (specify)' ? 1.5 : 2.5 }}>
          <InputLabel>Clinical Reason</InputLabel>
          <Select
            value={reason}
            label="Clinical Reason"
            onChange={(e) => setReason(e.target.value)}
            sx={{ borderRadius: '14px' }}
          >
            {REASON_OPTIONS.map(r => (
              <MenuItem key={r} value={r}>{r}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Custom reason text field (visible when "Other" is selected) */}
        {reason === 'Other (specify)' && (
          <TextField
            fullWidth
            size="small"
            label="Specify Reason"
            placeholder="e.g., Evaluate gastric ulceration"
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            InputProps={{ sx: { borderRadius: '14px' } }}
            sx={{ mb: 2.5 }}
          />
        )}

        {/* Priority — Segmented Buttons */}
        <Typography variant="caption" sx={{ fontWeight: 700, color: isDark ? '#89D7B7' : '#428475', display: 'block', mb: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Priority Level
        </Typography>
        <ToggleButtonGroup
          value={priority}
          exclusive
          onChange={(_, val) => val && setPriority(val)}
          sx={{
            mb: 2.5,
            width: '100%',
            '& .MuiToggleButton-root': {
              flex: 1,
              borderRadius: '12px !important',
              fontWeight: 700,
              fontSize: '0.78rem',
              textTransform: 'none',
              border: '1.5px solid transparent',
              py: 1,
              transition: 'all 0.2s ease',
              '&:not(:last-of-type)': { mr: 1 },
            }
          }}
        >
          {[
            { value: 'Routine', label: '🟢 Routine' },
            { value: 'Normal', label: '🟡 Normal' },
            { value: 'Urgent', label: '🔴 Urgent' }
          ].map(p => {
            const colors = getPriorityColor(p.value);
            const isActive = priority === p.value;
            return (
              <ToggleButton
                key={p.value}
                value={p.value}
                sx={{
                  bgcolor: isActive ? colors.bg : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
                  borderColor: isActive ? `${colors.border} !important` : 'transparent !important',
                  color: isActive ? colors.text : (isDark ? '#FAF2F5' : '#1A312C'),
                  '&:hover': {
                    bgcolor: colors.bg,
                  }
                }}
              >
                {p.label}
              </ToggleButton>
            );
          })}
        </ToggleButtonGroup>

        {/* Fasting Requirement */}
        <FormControl fullWidth size="small" sx={{ mb: 2.5 }}>
          <InputLabel>Fasting Requirement</InputLabel>
          <Select
            value={fasting}
            label="Fasting Requirement"
            onChange={(e) => setFasting(e.target.value)}
            sx={{ borderRadius: '14px' }}
          >
            {FASTING_OPTIONS.map(f => (
              <MenuItem key={f} value={f}>
                {f === 'Not Required' ? '✅ Not Required' : `⏱️ ${f}`}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Special Instructions */}
        <TextField
          fullWidth
          size="small"
          label="Special Instructions (Optional)"
          placeholder="e.g., Collect morning sample, avoid caffeine 24hrs prior"
          value={specialInstructions}
          onChange={(e) => setSpecialInstructions(e.target.value)}
          multiline
          minRows={2}
          maxRows={3}
          InputProps={{ sx: { borderRadius: '14px' } }}
          sx={{ mb: 1 }}
        />
      </DialogContent>

      <DialogActions sx={{
        px: 3,
        pb: 2.5,
        pt: 1.5,
        gap: 1.5,
        borderTop: isDark ? '1px solid rgba(137, 215, 183, 0.1)' : '1px solid rgba(0, 0, 0, 0.05)'
      }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderRadius: '14px',
            fontWeight: 700,
            textTransform: 'none',
            px: 3,
            borderColor: isDark ? 'rgba(137, 215, 183, 0.3)' : 'rgba(0, 0, 0, 0.15)',
            color: isDark ? '#89D7B7' : '#428475'
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={!testName.trim()}
          startIcon={<CheckIcon />}
          sx={{
            borderRadius: '14px',
            fontWeight: 800,
            textTransform: 'none',
            px: 3,
            bgcolor: 'var(--color-forest)',
            color: '#ffffff',
            boxShadow: '0 4px 14px rgba(66, 132, 117, 0.3)',
            '&:hover': {
              bgcolor: isDark ? '#2D6B55' : '#1A5A44',
              boxShadow: '0 6px 20px rgba(66, 132, 117, 0.4)'
            },
            '&.Mui-disabled': {
              bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
              color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'
            }
          }}
        >
          {isEditing ? 'Update Investigation' : 'Add Investigation'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InvestigationDetailDialog;
