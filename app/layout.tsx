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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
                if (isMobile && (window.location.hostname === 'medizo.life' || window.location.hostname === 'www.medizo.life')) {
                  window.location.href = 'https://m.medizo.life' + window.location.pathname + window.location.search;
                }
              })();
            `,
          }}
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
