import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    
    <div className="flex flex-col md:flex-row h-screen bg-slate-50 relative">
      
        <aside className="hidden md:flex w-64 bg-slate-900 text-white flex-col p-6 shadow-xl z-20">
        <h2 className="text-2xl font-extrabold mb-10 tracking-tight text-center">CareerSync</h2>
        <nav className="flex flex-col gap-3">
          <Link href="/dashboard/jobs" className="px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors font-medium">
            Job Tracker
          </Link>
          <Link href="/dashboard/coach" className="px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors font-medium">
            AI Coach
          </Link>
        </nav>
      </aside>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
        {children}
      </main>

      
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-slate-900 text-white flex justify-around items-center p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 border-t border-slate-700">
        <Link href="/dashboard/jobs" className="flex flex-col items-center gap-1 hover:text-slate-300 transition-colors">
          <span className="text-sm font-semibold">Jobs</span>
        </Link>
        <div className="w-px h-6 bg-slate-700"></div>
        <Link href="/dashboard/coach" className="flex flex-col items-center gap-1 hover:text-slate-300 transition-colors">
          <span className="text-sm font-semibold">AI Coach</span>
        </Link>
      </nav>

    </div>
  );
}