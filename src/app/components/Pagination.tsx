"use client";

import { usePathname, useSearchParams, useRouter } from "next/navigation";

export default function Pagination({
  totalPages,
  currentPage,
}: {
  totalPages: number;
  currentPage: number;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { replace } = useRouter();

  if (totalPages <= 1) return null;

  const createPageURL = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  return (
    <div className="flex justify-between items-center mt-8 border-t border-slate-200 pt-6">
      
      <button
        disabled={currentPage === 1}
        onClick={() => replace(createPageURL(currentPage - 1))}
        className="px-4 py-2 cursor-pointer text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        Previous
      </button>

      <span className="text-sm font-medium text-slate-500">
        Page {currentPage} of {totalPages}
      </span>

    
      <button
        disabled={currentPage === totalPages}
        onClick={() => replace(createPageURL(currentPage + 1))}
        className="px-4 py-2 cursor-pointer text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        Next
      </button>
    </div>
  );
}
