import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
export const dynamic = 'force-dynamic';
import { Toaster } from 'sonner';
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CareerSync AI | Your Elite Job Tracker", 
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