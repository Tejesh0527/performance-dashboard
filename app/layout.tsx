import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'PerfDash — High-Performance Data Visualization',
  description:
    'Real-time 10,000+ data point visualization dashboard built with Next.js 14 App Router, TypeScript, and raw Canvas rendering at 60fps.',
  keywords: ['dashboard', 'real-time', 'performance', 'visualization', 'Next.js'],
};

export const viewport: Viewport = {
  themeColor: '#0f1117',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
