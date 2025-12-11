import type { Metadata } from 'next';
import { Syne, Outfit } from 'next/font/google';
import './globals.css';
import './theme.css';
import { ThemeProvider } from '@/app/providers/theme-provider';

const displayFont = Syne({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const bodyFont = Outfit({
  variable: '--font-body',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'FlexFinToolkit — Premium Financial Dashboard',
  description: 'Luxury fintech dashboard for sophisticated financial modeling and scenario analysis',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${displayFont.variable} ${bodyFont.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
