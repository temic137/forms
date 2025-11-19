
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import Navigation from "@/components/Navigation";
import { ToastProvider } from "@/contexts/ToastContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Forms - AI Form Builder",
  description: "Beautiful forms, zero drag-and-drop hell. Just chat with the AI and watch it appear.",
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/favicon.svg',
  },
  openGraph: {
    title: "Forms - AI Form Builder",
    description: "Create beautiful forms instantly with AI assistance",
    images: [
      {
        url: '/Preview.png',
        width: 1200,
        height: 630,
        alt: 'Forms - AI Form Builder Preview',
      }
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Forms - AI Form Builder",
    description: "Create beautiful forms instantly with AI assistance",
    images: ['/Preview.png'],
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
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
