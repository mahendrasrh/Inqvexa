import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: 'INQVEXA',
  icons: { icon: '/favicon.ico', apple: '/apple-touch-icon.png' },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#07111F' };

// Applies the saved theme before first paint so light-mode visitors do not see a dark flash.
const THEME_BOOT = `try{if(localStorage.getItem('inqvexa-theme')==='light'){document.documentElement.setAttribute('data-theme','light')}}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Script src="/inqvexa-site.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
