import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import Navigation from "@/components/Navigation";
import { ToastProvider } from "@/contexts/ToastContext";
import { JsonLd, websiteSchema, organizationSchema } from "@/lib/seo/json-ld";

// Use system fonts with fallback
const geistSans = localFont({
  src: [
    {
      path: "../fonts/GeistVF.woff2",
      weight: "100 900",
      style: "normal",
    },
  ],
  variable: "--font-geist-sans",
  display: "swap",
  fallback: [
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "Oxygen",
    "Ubuntu",
    "sans-serif",
  ],
});

const geistMono = localFont({
  src: [
    {
      path: "../fonts/GeistMonoVF.woff2",
      weight: "100 900",
      style: "normal",
    },
  ],
  variable: "--font-geist-mono",
  display: "swap",
  fallback: ["ui-monospace", "SFMono-Regular", "monospace"],
});

// Base URL for production - will be used for canonical URLs and Open Graph
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://forms.example.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Forms - AI Form Builder",
    template: "%s | Forms",
  },
  description:
    "Beautiful forms, zero drag-and-drop hell. Just chat with the AI and watch it appear. Create high-converting forms in minutes with AI-powered form generation.",
  keywords: [
    "form builder",
    "AI forms",
    "form generator",
    "survey builder",
    "contact forms",
    "feedback forms",
    "no-code forms",
    "drag and drop forms",
  ],
  authors: [{ name: "Forms Team" }],
  creator: "Forms",
  publisher: "Forms",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Forms",
    title: "Forms - AI Form Builder",
    description:
      "Beautiful forms, zero drag-and-drop hell. Just chat with the AI and watch it appear. Create high-converting forms in minutes.",
    images: [
      {
        url: "/Preview.png",
        width: 1200,
        height: 630,
        alt: "Forms - AI Form Builder Preview",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Forms - AI Form Builder",
    description:
      "Beautiful forms, zero drag-and-drop hell. Just chat with the AI and watch it appear.",
    images: ["/Preview.png"],
    creator: "@forms",
  },
  alternates: {
    canonical: siteUrl,
  },
  category: "Technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <JsonLd data={websiteSchema} />
        <JsonLd data={organizationSchema} />
      </head>
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
