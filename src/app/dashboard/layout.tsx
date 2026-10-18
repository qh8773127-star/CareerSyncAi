"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import SignOut from "../components/SignOut";

const NAV_LINKS = [
  { href: "/dashboard/jobs", label: "Jobs" },
  { href: "/dashboard/coach", label: "AI Coach" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between relative">
          
          <Link
            href="/dashboard/jobs"
            className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900"
          >
            CareerSync
          </Link>

          {/* Desktop Nav & SignOut (Hidden on Mobile) */}
          <div className="hidden md:flex items-center gap-4">
            <nav className="flex items-center gap-1">
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      isActive
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
            <div className="pl-4 border-l border-slate-200">
              <SignOut />
            </div>
          </div>

          {/* Mobile Menu Button (Settings/Profile Icon) */}
          <div className="md:hidden flex items-center" ref={menuRef}>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
              aria-label="Menu"
            >
              {/* Settings/Gear Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </button>

            {/* Mobile Dropdown Menu */}
            {isMobileMenuOpen && (
              <div className="absolute top-14 right-4 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-2 border-b border-slate-100 mb-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Options
                  </p>
                </div>
                
                <div className="px-2 py-1">
                  <SignOut />
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 pb-24 md:pb-8">
        {children}
      </main>

      {/* Mobile Bottom Nav (Sirf Links hain, koi SignOut nahi) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200">
        <div className="flex items-center h-16">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex-1 flex flex-col items-center justify-center gap-1 h-full transition-colors ${
                  isActive ? "text-slate-900" : "text-slate-400"
                }`}
              >
                <span className="text-xs font-semibold">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}