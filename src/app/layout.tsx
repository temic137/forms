import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import Navigation from "@/components/layout/Navigation";
import { ToastProvider } from "@/contexts/ToastContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://www.anyform.live'),
  title: {
    default: "AnyForm - AI Form Builder",
    template: "%s | AnyForm"
  },
  description: "Create beautiful forms instantly with AI assistance. Just describe your form, upload a file, or paste a URL, and let AI build it for you.",
  keywords: ["AI form builder", "form generator", "online forms", "survey maker", "quiz builder", "AI surveys"],
  authors: [{ name: "AnyForm Team" }],
  creator: "AnyForm",
  publisher: "AnyForm",
  openGraph: {
    title: "AnyForm - AI Form Builder",
    description: "Stop building forms manually. Just describe them to our AI.",
    url: 'https://www.anyform.live',
    siteName: 'AnyForm',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://www.anyform.live/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AnyForm Preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@anyform',
    title: "AnyForm - AI Form Builder",
    description: "Stop building forms manually. Just describe them to our AI.",
    creator: "@anyform",
    images: {
      url: 'https://www.anyform.live/og-image.png',
      alt: 'AnyForm - AI Form Builder Preview',
      width: 1200,
      height: 630,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/favicon.svg',
  },
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
  verification: {
    google: 'npkLyl10kgmKRhPQvvVohCxGTtMX9gDj_mF15aBOzQk',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <ToastProvider>
            <Navigation />
            {children}
            <Analytics />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
