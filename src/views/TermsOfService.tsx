'use client';
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Divider,
  IconButton,
  Link,
  Alert
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Gavel as GavelIcon,
  MedicalServices as MedicalIcon
} from '@mui/icons-material';
import { useThemeContext } from '../contexts/ThemeContext';

const TermsOfService = () => {
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';

  const sectionStyle = {
    mb: 3,
  };

  const headingStyle = {
    fontWeight: 700,
    color: isDark ? '#89D7B7' : '#1A312C',
    mb: 1.5,
    fontSize: '1.15rem',
  };

  const bodyStyle = {
    color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.75)',
    fontSize: '0.9rem',
    lineHeight: 1.8,
    mb: 1,
  };

  const bulletStyle = {
    ...bodyStyle,
    pl: 2,
  };

  return (
    <Container maxWidth="md" sx={{ py: 3, pb: 12 }}>
      {/* Back Button */}
      <Box sx={{ mb: 2 }}>
        <IconButton
          component={RouterLink}
          to="/"
          sx={{ color: isDark ? '#89D7B7' : '#1A312C' }}
        >
          <ArrowBackIcon />
        </IconButton>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, sm: 4 },
          borderRadius: '20px',
          bgcolor: isDark ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.95)',
          border: `1px solid ${isDark ? 'rgba(137, 215, 183, 0.15)' : 'rgba(26, 49, 44, 0.1)'}`,
        }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <GavelIcon sx={{ color: isDark ? '#89D7B7' : '#1A312C', fontSize: 32 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: isDark ? '#ffffff' : '#1A312C' }}>
              Terms of Service
            </Typography>
            <Typography variant="caption" sx={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
              Last updated: July 2026
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 3, borderColor: isDark ? 'rgba(137, 215, 183, 0.15)' : 'rgba(0,0,0,0.08)' }} />

        {/* Medical Disclaimer Alert */}
        <Alert
          severity="warning"
          icon={<MedicalIcon />}
          sx={{
            mb: 3,
            borderRadius: '14px',
            bgcolor: isDark ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.08)',
            border: `1px solid ${isDark ? 'rgba(245, 158, 11, 0.3)' : 'rgba(245, 158, 11, 0.25)'}`,
            '& .MuiAlert-icon': { color: '#F59E0B' },
            '& .MuiAlert-message': { color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)' },
          }}
        >
          <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', mb: 0.5 }}>
            Important Medical Disclaimer
          </Typography>
          <Typography sx={{ fontSize: '0.85rem', lineHeight: 1.7 }}>
            Medizo is a <strong>healthcare management and prescription organization tool</strong>. It does{' '}
            <strong>not</strong> provide medical diagnosis, treatment advice, drug interaction warnings, or replace
            professional healthcare consultation. Always consult a qualified healthcare professional for medical
            advice, diagnosis, or treatment. Never disregard professional medical advice or delay seeking it
            because of information accessed through this application.
          </Typography>
        </Alert>

        {/* Acceptance of Terms */}
        <Box sx={sectionStyle}>
          <Typography sx={headingStyle}>1. Acceptance of Terms</Typography>
          <Typography sx={bodyStyle}>
            By accessing or using the Medizo application and services ("Service"), you agree to be bound by these
            Terms of Service ("Terms"). If you do not agree to these Terms, you may not access or use the Service.
            These Terms apply to all users, including doctors, patients, and pharmacists.
          </Typography>
        </Box>

        {/* Description of Service */}
        <Box sx={sectionStyle}>
          <Typography sx={headingStyle}>2. Description of Service</Typography>
          <Typography sx={bodyStyle}>
            Medizo provides a digital platform for:
          </Typography>
          <Typography sx={bulletStyle}>• Creating and managing digital prescriptions with QR code verification</Typography>
          <Typography sx={bulletStyle}>• Maintaining patient medical records and prescription history</Typography>
          <Typography sx={bulletStyle}>• Enabling pharmacists to verify and dispense prescriptions via QR scanning</Typography>
          <Typography sx={bulletStyle}>• Facilitating communication between healthcare providers and patients</Typography>
          <Typography sx={bulletStyle}>• Generating downloadable prescription PDFs</Typography>
        </Box>

        {/* Medical Disclaimer */}
        <Box sx={sectionStyle}>
          <Typography sx={headingStyle}>3. Medical Disclaimer</Typography>
          <Typography sx={bodyStyle}>
            THE SERVICE IS A HEALTHCARE MANAGEMENT TOOL ONLY. IT DOES NOT:
          </Typography>
          <Typography sx={bulletStyle}>• Provide medical diagnosis or treatment recommendations</Typography>
          <Typography sx={bulletStyle}>• Replace the need for professional medical consultation</Typography>
          <Typography sx={bulletStyle}>• Verify the clinical accuracy or appropriateness of prescriptions</Typography>
          <Typography sx={bulletStyle}>• Check for drug interactions, allergies, or contraindications</Typography>
          <Typography sx={bulletStyle}>• Guarantee the accuracy of any health-related information entered by users</Typography>
          <Typography sx={{ ...bodyStyle, mt: 1, fontWeight: 600 }}>
            All medical decisions remain the sole responsibility of the prescribing healthcare professional.
            Patients should always consult their doctor or pharmacist regarding any medical concerns.
          </Typography>
        </Box>

        {/* User Accounts and Responsibilities */}
        <Box sx={sectionStyle}>
          <Typography sx={headingStyle}>4. User Accounts & Responsibilities</Typography>
          <Typography sx={bodyStyle}>
            When creating an account, you agree to:
          </Typography>
          <Typography sx={bulletStyle}>• Provide accurate, current, and complete registration information</Typography>
          <Typography sx={bulletStyle}>• Maintain the security and confidentiality of your login credentials</Typography>
          <Typography sx={bulletStyle}>• Notify us immediately of any unauthorized use of your account</Typography>
          <Typography sx={bulletStyle}>• Accept responsibility for all activities under your account</Typography>

          <Typography sx={{ ...bodyStyle, fontWeight: 600, mt: 2 }}>For Doctors:</Typography>
          <Typography sx={bulletStyle}>• You confirm that you are a licensed medical practitioner</Typography>
          <Typography sx={bulletStyle}>• You are solely responsible for the clinical accuracy of prescriptions you create</Typography>
          <Typography sx={bulletStyle}>• You will comply with all applicable medical regulations and standards</Typography>

          <Typography sx={{ ...bodyStyle, fontWeight: 600, mt: 2 }}>For Pharmacists:</Typography>
          <Typography sx={bulletStyle}>• You confirm that you hold a valid pharmacy license</Typography>
          <Typography sx={bulletStyle}>• You will verify prescriptions according to applicable pharmaceutical regulations</Typography>

          <Typography sx={{ ...bodyStyle, fontWeight: 600, mt: 2 }}>For Patients:</Typography>
          <Typography sx={bulletStyle}>• You understand that prescription information is for your reference only</Typography>
          <Typography sx={bulletStyle}>• You will consult your healthcare provider for medical decisions</Typography>
        </Box>

        {/* Acceptable Use */}
        <Box sx={sectionStyle}>
          <Typography sx={headingStyle}>5. Acceptable Use</Typography>
          <Typography sx={bodyStyle}>You agree NOT to:</Typography>
          <Typography sx={bulletStyle}>• Use the Service for any unlawful purpose</Typography>
          <Typography sx={bulletStyle}>• Create fraudulent prescriptions or falsify medical records</Typography>
          <Typography sx={bulletStyle}>• Impersonate a healthcare professional</Typography>
          <Typography sx={bulletStyle}>• Attempt to access another user's account without authorization</Typography>
          <Typography sx={bulletStyle}>• Reverse engineer, decompile, or disassemble any part of the Service</Typography>
          <Typography sx={bulletStyle}>• Transmit malicious code, viruses, or harmful software</Typography>
          <Typography sx={bulletStyle}>• Use the Service to send spam or unsolicited communications</Typography>
        </Box>

        {/* Intellectual Property */}
        <Box sx={sectionStyle}>
          <Typography sx={headingStyle}>6. Intellectual Property</Typography>
          <Typography sx={bodyStyle}>
            The Service and its original content, features, and functionality are owned by Medizo and are protected
            by international copyright, trademark, and other intellectual property laws. You may not copy, modify,
            distribute, or create derivative works based on the Service without our express written permission.
          </Typography>
        </Box>

        {/* Limitation of Liability */}
        <Box sx={sectionStyle}>
          <Typography sx={headingStyle}>7. Limitation of Liability</Typography>
          <Typography sx={bodyStyle}>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, MEDIZO AND ITS DIRECTORS, EMPLOYEES, PARTNERS, AND AFFILIATES
            SHALL NOT BE LIABLE FOR:
          </Typography>
          <Typography sx={bulletStyle}>• Any indirect, incidental, special, consequential, or punitive damages</Typography>
          <Typography sx={bulletStyle}>• Any loss of profits, data, or business opportunities</Typography>
          <Typography sx={bulletStyle}>• Any damages arising from medical decisions made based on information in the Service</Typography>
          <Typography sx={bulletStyle}>• Any errors, inaccuracies, or omissions in prescription data entered by users</Typography>
          <Typography sx={bulletStyle}>• Service interruptions, downtime, or data loss</Typography>
          <Typography sx={{ ...bodyStyle, mt: 1 }}>
            Our total liability for any claims arising from your use of the Service shall not exceed the amount
            you paid us, if any, in the past twelve (12) months.
          </Typography>
        </Box>

        {/* Account Termination */}
        <Box sx={sectionStyle}>
          <Typography sx={headingStyle}>8. Account Termination</Typography>
          <Typography sx={bodyStyle}>
            You may delete your account at any time through the "Delete Account" option in your Profile settings.
            Upon account deletion:
          </Typography>
          <Typography sx={bulletStyle}>• Your personal information will be permanently removed</Typography>
          <Typography sx={bulletStyle}>• Prescription records may be retained as required by healthcare regulations</Typography>
          <Typography sx={bulletStyle}>• You will lose access to all data associated with your account</Typography>
          <Typography sx={{ ...bodyStyle, mt: 1 }}>
            We reserve the right to suspend or terminate your account if you violate these Terms or engage
            in fraudulent or harmful activities.
          </Typography>
        </Box>

        {/* Governing Law */}
        <Box sx={sectionStyle}>
          <Typography sx={headingStyle}>9. Governing Law</Typography>
          <Typography sx={bodyStyle}>
            These Terms shall be governed by and construed in accordance with the laws of India, without regard to
            its conflict of law provisions. Any disputes arising from these Terms or the Service shall be resolved
            through the appropriate courts of jurisdiction.
          </Typography>
        </Box>

        {/* Changes to Terms */}
        <Box sx={sectionStyle}>
          <Typography sx={headingStyle}>10. Changes to These Terms</Typography>
          <Typography sx={bodyStyle}>
            We reserve the right to modify or replace these Terms at any time. Material changes will be communicated
            through the Service or via email. Your continued use of the Service after changes constitutes acceptance
            of the updated Terms.
          </Typography>
        </Box>

        {/* Contact */}
        <Box sx={sectionStyle}>
          <Typography sx={headingStyle}>11. Contact Us</Typography>
          <Typography sx={bodyStyle}>
            If you have any questions about these Terms, please contact us at:
          </Typography>
          <Typography sx={bulletStyle}>
            • Email:{' '}
            <Link href="mailto:support@medizo.life" sx={{ color: isDark ? '#89D7B7' : '#1A312C', fontWeight: 600 }}>
              support@medizo.life
            </Link>
          </Typography>
          <Typography sx={bulletStyle}>
            • Website:{' '}
            <Link href="https://medizo.life" target="_blank" rel="noopener" sx={{ color: isDark ? '#89D7B7' : '#1A312C', fontWeight: 600 }}>
              medizo.life
            </Link>
          </Typography>
        </Box>

        <Divider sx={{ my: 3, borderColor: isDark ? 'rgba(137, 215, 183, 0.15)' : 'rgba(0,0,0,0.08)' }} />

        {/* Privacy Policy Link */}
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography sx={{ ...bodyStyle, fontSize: '0.85rem' }}>
            Please also review our{' '}
            <Link
              component={RouterLink}
              to="/privacy-policy"
              sx={{ color: isDark ? '#89D7B7' : '#1A312C', fontWeight: 700, textDecoration: 'underline' }}
            >
              Privacy Policy
            </Link>{' '}
            for information on how we handle your data.
          </Typography>
        </Box>

        <Typography sx={{ ...bodyStyle, textAlign: 'center', fontSize: '0.8rem', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
          © {new Date().getFullYear()} Medizo. All rights reserved.
        </Typography>
      </Paper>
    </Container>
  );
};

export default TermsOfService;
