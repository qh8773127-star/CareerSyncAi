export default function Loading() {
  return (
    <div className="min-h-screen p-6 md:p-10 max-w-5xl mx-auto space-y-10 animate-pulse">

      <header className="flex justify-between items-center border-b top-0 z-50 bg-slate-50/80 backdrop-blur-md border-slate-200 py-4 mb-4">
        <div className="h-9 w-24 bg-slate-200 rounded-md" />
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white p-4 rounded-xl border border-slate-200"
          >
            <div className="h-3 w-16 bg-slate-200 rounded mb-3" />
            <div className="h-7 w-12 bg-slate-300 rounded" />
          </div>
        ))}
      </section>

      <section className="bg-white p-6 rounded-xl border border-slate-200">
        <div className="h-5 w-40 bg-slate-200 rounded mb-4" />
        <div className="h-32 w-full bg-slate-100 rounded-md mb-4" />
        <div className="h-10 w-48 bg-slate-300 rounded-md" />
      </section>

      <section className="space-y-4">
        <div className="h-7 w-48 bg-slate-200 rounded border-b border-slate-200 pb-2" />
        
        <div className="h-11 w-full bg-slate-100 rounded-md" />

        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-5 rounded-xl border border-slate-200 bg-white"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1 space-y-3">
                <div className="h-5 w-2/3 bg-slate-300 rounded" />
                <div className="h-4 w-1/3 bg-slate-200 rounded" />
                <div className="flex gap-2 pt-2">
                  <div className="h-6 w-20 bg-slate-200 rounded-md" />
                  <div className="h-6 w-16 bg-slate-200 rounded-md" />
                  <div className="h-6 w-24 bg-slate-200 rounded-md" />
                </div>
              </div>
              <div className="h-9 w-24 bg-slate-200 rounded-md shrink-0 ml-4" />
            </div>
          </div>
        ))}
      </section>

    </div>
  );
}