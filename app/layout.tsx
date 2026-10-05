import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '../components/ThemeContext';
import { ToastProvider } from '../components/Toast';
import { AuthProvider } from '../components/AuthContext';
import { CookieConsent } from '../components/CookieConsent';

const siteBaseUrl = process.env.APP_URL || 'https://rasel.dev.bd';

export const metadata: Metadata = {
  metadataBase: new URL(siteBaseUrl),
  title: {
    default: 'রাসেল শিকদার | Notes & Tech Journal | প্রযুক্তি, প্রোগ্রামিং ও ভাবনা',
    template: '%s | রাসেল শিকদার',
  },
  description: 'রাসেল শিকদারের টেক জার্নাল ও নোটস — ফুল-স্ট্যাক ওয়েব ডেভেলপমেন্ট, রিঅ্যাক্ট, টাইপস্ক্রিপ্ট, সফটওয়্যার আর্কিটেকচার, ক্লাউড ও প্রযুক্তি ভাবনা নিয়ে গভীর বিশ্লেষণ ও ব্যবহারিক গাইড।',
  applicationName: 'রাসেল শিকদার জার্নাল',
  authors: [{ name: 'রাসেল শিকদার (Rasel Shikdar)', url: 'https://rasel.dev.bd' }],
  creator: 'রাসেল শিকদার',
  publisher: 'রাসেল শিকদার',
  alternates: {
    canonical: '/',
  },
  keywords: [
    'রাসেল শিকদার',
    'Rasel Shikdar',
    'বাংলা টেক ব্লগ',
    'ফুল স্ট্যাক ডেভেলপমেন্ট',
    'Full-Stack Developer Bangladesh',
    'React',
    'Next.js',
    'TypeScript',
    'সফটওয়্যার ইঞ্জিনিয়ারিং',
    'ওয়েব ডেভেলপমেন্ট',
    'প্রযুক্তি',
    'এআই',
    'সাইবার সিকিউরিটি',
    'ডিজিটাল সংস্কৃতি',
  ],
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-icon.svg', sizes: '180x180', type: 'image/svg+xml' },
    ],
    shortcut: ['/favicon.svg'],
  },
  manifest: '/manifest.webmanifest',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'রাসেল শিকদার | Notes & Tech Journal | প্রযুক্তি, প্রোগ্রামিং ও ভাবনা',
    description: 'রাসেল শিকদারের টেক জার্নাল ও নোটস — ফুল-স্ট্যাক ওয়েব ডেভেলপমেন্ট, রিঅ্যাক্ট, টাইপস্ক্রিপ্ট, সফটওয়্যার আর্কিটেকচার, ক্লাউড ও প্রযুক্তি ভাবনা নিয়ে গভীর বিশ্লেষণ ও ব্যবহারিক গাইড।',
    url: siteBaseUrl,
    type: 'website',
    locale: 'bn_BD',
    siteName: 'রাসেল শিকদার | ডিজিটাল ক্যানভাস ও জার্নাল',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'রাসেল শিকদার - ডিজিটাল ক্যানভাস ও টেক জার্নাল',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'রাসেল শিকদার | Notes & Tech Journal',
    description: 'রাসেল শিকদারের টেক জার্নাল ও নোটস — ফুল-স্ট্যাক ওয়েব ডেভেলপমেন্ট, প্রোগ্রামিং ও প্রযুক্তি ভাবনা নিয়ে গভীর বিশ্লেষণ ও গাইড।',
    site: '@raselshikdar_',
    creator: '@raselshikdar_',
    images: ['/og-image.jpg'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${siteBaseUrl}/#website`,
        url: siteBaseUrl,
        name: 'রাসেল শিকদার জার্নাল',
        alternateName: "Rasel's Digital Canvas & Journal",
        description: 'প্রযুক্তি, ফুল-স্ট্যাক সফটওয়্যার ইঞ্জিনিয়ারিং, ক্লাউড, অনুসন্ধান ও সমসাময়িক ভাবনা নিয়ে রাসেল শিকদারের একটি স্বাধীন টেক জার্নাল।',
        inLanguage: ['bn', 'en'],
        publisher: {
          '@id': `${siteBaseUrl}/#author`,
        },
      },
      {
        '@type': 'Person',
        '@id': `${siteBaseUrl}/#author`,
        name: 'রাসেল শিকদার',
        alternateName: 'Rasel Shikdar',
        url: 'https://rasel.dev.bd',
        email: 'info@rasel.dev.bd',
        jobTitle: 'ফুল-স্ট্যাক ডেভেলপার ও ক্রিয়েটিভ টেকনোলজিস্ট',
        image: `${siteBaseUrl}/og-image.jpg`,
        sameAs: [
          'https://github.com/raselshikdar',
          'https://linkedin.com/in/raselshikdar',
          'https://twitter.com/raselshikdar_',
          'https://facebook.com/raselverse',
          'https://rasel.dev.bd',
        ],
      },
      {
        '@type': 'Blog',
        '@id': `${siteBaseUrl}/#blog`,
        name: 'রাসেল শিকদার টেক ব্লগ ও জার্নাল',
        url: siteBaseUrl,
        publisher: {
          '@id': `${siteBaseUrl}/#author`,
        },
        author: {
          '@id': `${siteBaseUrl}/#author`,
        },
        inLanguage: 'bn',
      },
    ],
  };

  return (
    <html lang="bn" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Serif+Bengali:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/apple-icon.svg" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('rs_blog_theme');
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <ToastProvider>
          <AuthProvider>
            <ThemeProvider>
              {children}
              <CookieConsent />
            </ThemeProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
