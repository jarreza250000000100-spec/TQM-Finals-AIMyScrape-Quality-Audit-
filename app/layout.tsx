import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Quality Audit - AIMyScrape Process & Operations',
  description:
    'Authenticated employee quality audit platform for AIMyScrape (SimpleCode AI), facilitating structured Gemini interviews on scraper maintenance, false-zero detection, NYSCEF court filing, runner operations, and executive consolidation.',
  openGraph: {
    title: 'Quality Audit - AIMyScrape Process & Operations',
    description:
      'Authenticated employee quality audit platform for AIMyScrape (SimpleCode AI), facilitating structured Gemini interviews on scraper maintenance, false-zero detection, NYSCEF court filing, runner operations, and executive consolidation.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Quality Audit - AIMyScrape Process & Operations',
    description:
      'Authenticated employee quality audit platform for AIMyScrape (SimpleCode AI), facilitating structured Gemini interviews on scraper maintenance, false-zero detection, NYSCEF court filing, runner operations, and executive consolidation.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-slate-950 text-slate-100 antialiased">
      <body className="min-h-full flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-300" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
