"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

const JobSearchFilters = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleSearch = useDebouncedCallback(
    (term: string, currentParamsString: string) => {
      const params = new URLSearchParams(currentParamsString);
      params.set("page", "1");
      if (term) {
        params.set("query", term);
      } else {
        params.delete("query"); 
      }

      replace(`${pathname}?${params.toString()}`);
    },
    300,
  );

  const handleFilter = (status: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", "1");
    if (status && status !== "ALL") {
      params.set("status", status);
    } else {
      params.delete("status");
    }

    replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
      <div className="w-full sm:w-2/3 relative">
        <input
          type="text"
          placeholder="Search by job title or company..."
          defaultValue={searchParams.get("query")?.toString()}

          onChange={(e) =>
            handleSearch(e.target.value, searchParams.toString())
          }
          className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-400"
        />
      </div>

      <div className="w-full sm:w-1/3">
        <select
          defaultValue={searchParams.get("status")?.toString() || "ALL"}
          onChange={(e) => handleFilter(e.target.value)}
          className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 cursor-pointer text-slate-700 font-medium transition-all"
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="INTERVIEW">Interview</option>
          <option value="REJECTED">Rejected</option>
          <option value="HIRED">Hired</option>
        </select>
      </div>
    </div>
  );
};

export default JobSearchFilters;
