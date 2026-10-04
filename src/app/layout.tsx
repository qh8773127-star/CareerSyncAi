import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';

// Strictly sirf professional font load kar rahe hain
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CareerSync Dashboard", // Title bhi professional kar diya
  description: "Track and manage your job applications like a pro.",
};

// LayoutProps ka kachra hata kar standard React typing lagayi hai
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