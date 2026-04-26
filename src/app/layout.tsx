import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://promptly.lav1sh.online"),
  title: {
    default: "Promptly",
    template: "%s | Promptly",
  },
  description: "Build and deploy AI-powered web applications in seconds.",
  keywords: [
    "AI",
    "Coding Assistant",
    "Full-stack Developer",
    "AI Agents",
    "Next.js",
    "WebContainers",
  ],
  authors: [{ name: "Lavish" }],
  creator: "Lavish",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://promptly.lav1sh.online",
    siteName: "Promptly",
    title: "Promptly - AI Development Environment",
    description: "Build and deploy AI-powered web applications in seconds.",
    images: [
      {
        url: "/logo_large.svg",
        width: 1200,
        height: 630,
        alt: "Promptly Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Promptly - AI Development Environment",
    description: "Build and deploy AI-powered web applications in seconds.",
    images: ["/logo_large.svg"],
  },
  icons: {
    icon: [
      {
        url: "/logo-light.svg",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/logo-dark.svg",
        media: "(prefers-color-scheme: dark)",
      },
    ],
    apple: [
      {
        url: "/logo-light.svg",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/logo-dark.svg",
        media: "(prefers-color-scheme: dark)",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClerkProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Toaster />
            {children}
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
