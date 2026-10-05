import { auth } from "../auth";
import { redirect } from "next/navigation";
import AddJobForm from "../components/AddJobForm";
import SignOut from "../components/SignOut";
import JobActionButtons from "../components/JobActionButtons";
import { getJobStats } from "../actions/Job";
import DashboardStats from "../components/DashboardStats";
import JobSearchFilters from "../components/JobSearchFilters";
import Pagination from "../components/Pagination";
import { getFilteredJobs } from "../actions/Job"; 
import AiTester from "../components/AiTester";

export default async function DashboardPage({searchParams,}: {searchParams: Promise<{ query?: string; status?: string; page?: string }>;
}) {
  
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const { query, status, page } = await searchParams;
  const currentPage = page ? Number(page) : 1;

  const statsJob = await getJobStats();

  const { jobs: userJobs, totalPages } = await getFilteredJobs({
    query: query,
    status: status,
    page: currentPage,
  });

  return (
    <div className="min-h-screen p-6 md:p-10 max-w-5xl mx-auto space-y-10">
      <header className="flex justify-between items-center border-b sticky top-0 z-50 bg-slate-50/80 backdrop-blur-md border-slate-200 py-4 mb-4">
        <div>
          
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            CareerSync
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage and track your job applications
          </p>
        </div>
        <SignOut />
      </header>

      <section>
        <DashboardStats stats={statsJob} />
      </section>

      <section>
        <AiTester/>
      </section>


      <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <AddJobForm />
      </section>

      <section>
        <h2 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-200 pb-2">
          Your Tracked Jobs
        </h2>
        <JobSearchFilters />

        {userJobs.length === 0 ? (
          <div className="text-center p-12 bg-white border border-dashed border-slate-300 rounded-xl">
            <p className="text-slate-500 font-medium text-lg">
              No jobs tracked yet. Start applying!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {userJobs.map((job) => (
              <div
                key={job.id}
                className="group flex flex-col md:flex-row md:items-center justify-between p-5 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md transition-all duration-200"
              >
                <div className="flex flex-col mb-4 md:mb-0">
                  <h3 className="font-bold text-lg text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {job.title}
                  </h3>
                  <p className="text-slate-500 font-medium">{job.company}</p>
                </div>

                <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                  <JobActionButtons jobId={job.id} currentStatus={job.status} />

                  <span className="text-sm text-slate-400 font-medium text-right min-w-[90px]">
                    {job.createdAt.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            ))}
            <Pagination currentPage={currentPage} totalPages={totalPages} />
          </div>
        )}
      </section>
    </div>
  );
}
