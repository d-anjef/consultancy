import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Providers } from './providers';
import { siteConfig } from '@/config/site';
import { ServiceWorkerRegistration } from '@/components/pwa/ServiceWorkerRegistration';
import './globals.css';

// ─── SEO & App Metadata ─────────────────────────────────────────────────

export const metadata: Metadata = {
  // Base
  title: {
    default: siteConfig.name,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,

  // PWA & Manifest
  manifest: '/manifest.json',

  // Apple / iOS
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: siteConfig.shortName ?? siteConfig.name,
  },

  // Icons
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },

  // Format detection
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },

  // Private platform — no indexing
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },

  // Author & Publisher
  authors: [
    {
      name: 'Anjef Dangol',
      url: 'https://www.anjef.com.np/',
    },
  ],
  creator: 'Anjef Dangol',
  publisher: siteConfig.name,

  // Open Graph (for shared links)
  openGraph: {
    type: 'website',
    locale: 'en_NP',
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
  },

  // Referrer policy
  referrer: 'strict-origin-when-cross-origin',
};

// ─── Viewport Configuration ─────────────────────────────────────────────

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  minimumScale: 1,
  userScalable: true,
  viewportFit: 'cover', // For iPhone notch support
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#EAB308' },
    { media: '(prefers-color-scheme: dark)', color: '#111827' },
  ],
  colorScheme: 'light',
};

// ─── Root Layout ────────────────────────────────────────────────────────

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* ─── PWA: Apple Touch Icons ─── */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/icons/icon-192x192.png"
        />

        {/* ─── PWA: iOS Meta Tags ─── */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="default"
        />
        <meta
          name="apple-mobile-web-app-title"
          content={siteConfig.shortName ?? siteConfig.name}
        />

        {/* ─── PWA: General ─── */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content={siteConfig.name} />

        {/* ─── Microsoft / Windows ─── */}
        <meta name="msapplication-TileColor" content="#EAB308" />
        <meta name="msapplication-tap-highlight" content="no" />

        {/* ─── DNS Prefetch for Performance ─── */}
        <link rel="dns-prefetch" href="https://chiba-api.onrender.com" />
        <link rel="preconnect" href="https://chiba-api.onrender.com" crossOrigin="anonymous" />

        {/* ─── Prevent auto-detection of phone numbers on iOS ─── */}
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body
        className="min-h-screen bg-background font-sans antialiased"
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}