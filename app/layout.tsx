import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '../components/ThemeContext';
import { ToastProvider } from '../components/Toast';
import { AuthProvider } from '../components/AuthContext';

export const metadata: Metadata = {
  title: 'সোহানুর রহমান | Notes | প্রযুক্তি, এআই, গবেষণা ও ডিজিটাল সংস্কৃতি',
  description: 'সোহানুর রহমানের Notes — প্রযুক্তি, এআই, গবেষণা, ডেটা, প্রোগ্রামিং, সাইবার নিরাপত্তা, ডিজিটাল সংস্কৃতি, ক্যারিয়ার ও বাংলাদেশ-কেন্দ্রিক প্রযুক্তি নিয়ে বাংলা ও ইংরেজি লেখা, বিশ্লেষণ ও গাইড।',
  applicationName: 'সোহানুর রহমান জার্নাল',
  authors: [{ name: 'সোহানুর রহমান', url: 'https://suhanurrahman.com' }],
  keywords: [
    'বাংলা ব্লগ',
    'প্রযুক্তি',
    'এআই',
    'ডেটা সায়েন্স',
    'গবেষণা',
    'কম্পিউটার প্রোগ্রামিং',
    'ডিজিটাল সংস্কৃতি',
    'সোহানুর রহমান'
  ],
  openGraph: {
    title: 'সোহানুর রহমান | Notes | প্রযুক্তি, এআই, গবেষণা ও ডিজিটাল সংস্কৃতি',
    description: 'সোহানুর রহমানের Notes — প্রযুক্তি, এআই, গবেষণা, ডেটা, প্রোগ্রামিং, সাইবার নিরাপত্তা, ডিজিটাল সংস্কৃতি, ক্যারিয়ার ও বাংলাদেশ-কেন্দ্রিক প্রযুক্তি নিয়ে বাংলা ও ইংরেজি লেখা, বিশ্লেষণ ও গাইড।',
    type: 'website',
    locale: 'bn_BD',
    siteName: 'সোহানুর রহমান জার্নাল',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'সোহানুর রহমান | Notes | প্রযুক্তি, এআই, গবেষণা ও ডিজিটাল সংস্কৃতি',
    description: 'সোহানুর রহমানের Notes — প্রযুক্তি, এআই, গবেষণা, ডেটা, প্রোগ্রামিং, সাইবার নিরাপত্তা, ডিজিটাল সংস্কৃতি, ক্যারিয়ার ও বাংলাদেশ-কেন্দ্রিক প্রযুক্তি নিয়ে বাংলা ও ইংরেজি লেখা, বিশ্লেষণ ও গাইড।',
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
        '@id': 'https://blog.suhanurrahman.com/#website',
        name: 'সোহানুর রহমান জার্নাল',
        description: 'প্রযুক্তি, গবেষণা, অনুসন্ধান, ডিজিটাল সংস্কৃতি ও ভাবনা নিয়ে একটি স্বাধীন জার্নাল।',
        inLanguage: ['bn'],
      },
      {
        '@type': 'Person',
        '@id': 'https://suhanurrahman.com/#author',
        name: 'সোহানুর রহমান',
        jobTitle: 'সফটওয়্যার প্রকৌশলী ও টেক গবেষক',
        email: 'suhanurrahman.r@gmail.com',
      }
    ]
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
            </ThemeProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
