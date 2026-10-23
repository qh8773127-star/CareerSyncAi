import Link from "next/link";
import Navbar from "@/app/components/Navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between relative">
          
          <Link
            href="/dashboard/jobs"
            className="flex items-center gap-2 text-lg sm:text-xl font-extrabold tracking-tight text-slate-900"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white text-sm">
              C
            </div>
            areerSync
          </Link>
          <Navbar />
          
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8">
        {children}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 safe-bottom">
        <div className="flex items-center h-16">
          <Link href="/dashboard/jobs" className="flex-1 flex flex-col items-center justify-center gap-1 h-full text-slate-600">
            <span className="text-xs font-semibold">Jobs</span>
          </Link>
          <Link href="/dashboard/coach" className="flex-1 flex flex-col items-center justify-center gap-1 h-full text-slate-600">
            <span className="text-xs font-semibold">AI Coach</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}