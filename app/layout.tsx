import type { Metadata } from 'next';
import ThemeRegistry from './ThemeRegistry';
import { AuthProvider } from '../src/contexts/AuthContext';
import '../src/index.css';

export const metadata: Metadata = {
  title: 'Medizo - Healthcare Management & Digital Prescriptions',
  description: 'Secure digital prescription platform connecting doctors, patients, and healthcare providers.',
  icons: {
    icon: '/LOGO.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap"
        />
      </head>
      <body>
        <ThemeRegistry>
          <AuthProvider>{children}</AuthProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
