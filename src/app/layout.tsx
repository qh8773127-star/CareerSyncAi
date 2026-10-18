import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';

// Strictly sirf professional font load kar rahe hain
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CareerSync AI | Your Elite Job Tracker", // Title bhi professional kar diya
  description: "AI-powered job application tracker and career coach.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 text-slate-900`}>
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}