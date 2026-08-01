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
  Link
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { useThemeContext } from '../contexts/ThemeContext';

const PrivacyPolicy = () => {
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
          <SecurityIcon sx={{ color: isDark ? '#89D7B7' : '#1A312C', fontSize: 32 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: isDark ? '#ffffff' : '#1A312C' }}>
              Privacy Policy
            </Typography>
            <Typography variant="caption" sx={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
              Last updated: July 2026
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 3, borderColor: isDark ? 'rgba(137, 215, 183, 0.15)' : 'rgba(0,0,0,0.08)' }} />

        {/* Introduction */}
        <Box sx={sectionStyle}>
          <Typography sx={bodyStyle}>
            Medizo ("we," "our," or "us") operates the Medizo mobile application and web platform (collectively, the "Service").
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service.
            Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not
            access the Service.
          </Typography>
        </Box>

        {/* Information We Collect */}
        <Box sx={sectionStyle}>
          <Typography sx={headingStyle}>1. Information We Collect</Typography>

          <Typography sx={{ ...bodyStyle, fontWeight: 600, mt: 1 }}>Personal Information</Typography>
          <Typography sx={bodyStyle}>When you register for an account, we collect:</Typography>
          <Typography sx={bulletStyle}>• Full name (first name, last name)</Typography>
          <Typography sx={bulletStyle}>• Email address</Typography>
          <Typography sx={bulletStyle}>• Account role (Doctor, Patient, or Pharmacist)</Typography>
          <Typography sx={bulletStyle}>• Contact number (optional)</Typography>
          <Typography sx={bulletStyle}>• Profile image (optional)</Typography>

          <Typography sx={{ ...bodyStyle, fontWeight: 600, mt: 2 }}>Health & Medical Data</Typography>
          <Typography sx={bodyStyle}>Depending on your role, we may collect and store:</Typography>
          <Typography sx={bulletStyle}>• Prescription records and medication details</Typography>
          <Typography sx={bulletStyle}>• Medical history and allergy information</Typography>
          <Typography sx={bulletStyle}>• Date of birth</Typography>
          <Typography sx={bulletStyle}>• Doctor specialization, license number, and clinic information</Typography>
          <Typography sx={bulletStyle}>• Pharmacy license and address details</Typography>

          <Typography sx={{ ...bodyStyle, fontWeight: 600, mt: 2 }}>Device & Technical Data</Typography>
          <Typography sx={bodyStyle}>We may automatically collect:</Typography>
          <Typography sx={bulletStyle}>• Device type and browser information</Typography>
          <Typography sx={bulletStyle}>• IP address and general location data</Typography>
          <Typography sx={bulletStyle}>• Usage patterns and interaction data within the app</Typography>

          <Typography sx={{ ...bodyStyle, fontWeight: 600, mt: 2 }}>Camera Access</Typography>
          <Typography sx={bodyStyle}>
            Our app requests camera access <strong>solely</strong> for the purpose of scanning prescription QR codes.
            Camera data is processed locally on your device and is not stored, transmitted, or shared with any third party.
          </Typography>
        </Box>

        {/* How We Use Your Information */}
        <Box sx={sectionStyle}>
          <Typography sx={headingStyle}>2. How We Use Your Information</Typography>
          <Typography sx={bodyStyle}>We use the information we collect to:</Typography>
          <Typography sx={bulletStyle}>• Provide, operate, and maintain the Service</Typography>
          <Typography sx={bulletStyle}>• Create and manage your user account</Typography>
          <Typography sx={bulletStyle}>• Process and manage digital prescriptions</Typography>
          <Typography sx={bulletStyle}>• Enable secure communication between doctors, patients, and pharmacists</Typography>
          <Typography sx={bulletStyle}>• Generate prescription PDFs with QR code verification</Typography>
          <Typography sx={bulletStyle}>• Send email notifications for prescription updates</Typography>
          <Typography sx={bulletStyle}>• Improve and personalize the user experience</Typography>
          <Typography sx={bulletStyle}>• Comply with legal obligations</Typography>
        </Box>

        {/* Third-Party Services */}
        <Box sx={sectionStyle}>
          <Typography sx={headingStyle}>3. Third-Party Services</Typography>
          <Typography sx={bodyStyle}>We integrate with the following third-party services:</Typography>
          <Typography sx={bulletStyle}>
            • <strong>Google OAuth:</strong> Used for optional "Sign in with Google" authentication. We receive your name
            and email from Google. We do not access your Google contacts, calendar, or other Google services.
          </Typography>
          <Typography sx={bulletStyle}>
            • <strong>DigiLocker (India):</strong> Optional integration for document verification. Data is accessed only
            with your explicit consent and authorization.
          </Typography>
          <Typography sx={{ ...bodyStyle, mt: 1 }}>
            We do not sell, trade, or share your personal or health data with third parties for advertising or marketing purposes.
          </Typography>
        </Box>

        {/* Data Security */}
        <Box sx={sectionStyle}>
          <Typography sx={headingStyle}>4. Data Security</Typography>
          <Typography sx={bodyStyle}>
            We implement appropriate technical and organizational security measures to protect your information:
          </Typography>
          <Typography sx={bulletStyle}>• All data is transmitted over HTTPS (TLS/SSL encryption)</Typography>
          <Typography sx={bulletStyle}>• Passwords are hashed using industry-standard algorithms</Typography>
          <Typography sx={bulletStyle}>• Authentication tokens (JWT) are used for secure session management</Typography>
          <Typography sx={bulletStyle}>• Database connections use SSL/TLS encryption</Typography>
          <Typography sx={{ ...bodyStyle, mt: 1 }}>
            While we strive to use commercially acceptable means to protect your data, no method of electronic
            transmission or storage is 100% secure, and we cannot guarantee absolute security.
          </Typography>
        </Box>

        {/* Data Retention */}
        <Box sx={sectionStyle}>
          <Typography sx={headingStyle}>5. Data Retention</Typography>
          <Typography sx={bodyStyle}>
            We retain your personal information for as long as your account is active or as needed to provide you with our
            services. Prescription records may be retained for the period required by applicable healthcare regulations.
          </Typography>
          <Typography sx={bodyStyle}>
            You may request deletion of your account and associated data at any time through the "Delete Account" option
            in your profile settings or by contacting us at{' '}
            <Link href="mailto:privacy@medizo.life" sx={{ color: isDark ? '#89D7B7' : '#1A312C', fontWeight: 600 }}>
              privacy@medizo.life
            </Link>.
          </Typography>
        </Box>

        {/* Your Rights */}
        <Box sx={sectionStyle}>
          <Typography sx={headingStyle}>6. Your Rights</Typography>
          <Typography sx={bodyStyle}>You have the right to:</Typography>
          <Typography sx={bulletStyle}>• Access the personal data we hold about you</Typography>
          <Typography sx={bulletStyle}>• Request correction of inaccurate personal data</Typography>
          <Typography sx={bulletStyle}>• Request deletion of your account and personal data</Typography>
          <Typography sx={bulletStyle}>• Withdraw consent for data processing</Typography>
          <Typography sx={bulletStyle}>• Export your prescription data</Typography>
          <Typography sx={bulletStyle}>• Lodge a complaint with a data protection authority</Typography>
        </Box>

        {/* Children's Privacy */}
        <Box sx={sectionStyle}>
          <Typography sx={headingStyle}>7. Children's Privacy</Typography>
          <Typography sx={bodyStyle}>
            Our Service is not directed to individuals under the age of 18. We do not knowingly collect personal information
            from children under 18. If we become aware that a child under 18 has provided us with personal information,
            we will take steps to delete such information.
          </Typography>
        </Box>

        {/* Changes to This Policy */}
        <Box sx={sectionStyle}>
          <Typography sx={headingStyle}>8. Changes to This Privacy Policy</Typography>
          <Typography sx={bodyStyle}>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new
            Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy
            Policy periodically for any changes.
          </Typography>
        </Box>

        {/* Contact */}
        <Box sx={sectionStyle}>
          <Typography sx={headingStyle}>9. Contact Us</Typography>
          <Typography sx={bodyStyle}>
            If you have any questions about this Privacy Policy or our data practices, please contact us at:
          </Typography>
          <Typography sx={bulletStyle}>
            • Email:{' '}
            <Link href="mailto:privacy@medizo.life" sx={{ color: isDark ? '#89D7B7' : '#1A312C', fontWeight: 600 }}>
              privacy@medizo.life
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

        <Typography sx={{ ...bodyStyle, textAlign: 'center', fontSize: '0.8rem', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
          © {new Date().getFullYear()} Medizo. All rights reserved.
        </Typography>
      </Paper>
    </Container>
  );
};

export default PrivacyPolicy;
