import './globals.css';

export const metadata = {
  title: 'Deevo Account',
  description: 'One Account. All of Deevo. Sign in or create your Deevo Account to access the entire Deevo ecosystem.',
  keywords: ['Deevo', 'OAuth', 'Account', 'Authentication', 'Sign In'],
  authors: [{ name: 'Deevo' }],
  openGraph: {
    title: 'Deevo Account',
    description: 'One Account. All of Deevo.',
    url: 'https://deevo.tech',
    siteName: 'Deevo Account',
    type: 'website',
  },
};

import { AuthProvider } from '@/lib/auth-context';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
