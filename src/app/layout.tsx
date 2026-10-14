import type { Metadata, Viewport } from "next";
import { Instrument_Serif } from "next/font/google";
import { Geist } from "next/font/google";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CollegeNav — Intelligent Campus Bus Navigation",
  description:
    "Real-time college bus navigation, schedules, stop information, and disruption notices with honest arrival estimates.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CollegeNav",
  },
};

export const viewport: Viewport = {
  themeColor: "#0F2F6B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${instrumentSerif.variable}`}>
      <body className="font-sans bg-paper text-ink antialiased">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <main id="main-content" className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
