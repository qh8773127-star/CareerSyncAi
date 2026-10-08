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
import DeleteAllJobsButton from "../components/DeleteAllJobsButton";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; status?: string; page?: string }>;
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
        <DeleteAllJobsButton/>
        <SignOut />
      </header>

      <section>
        <DashboardStats stats={statsJob} />
      </section>

      <section>
        <AiTester />
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
                className="group flex flex-col md:flex-row md:items-start justify-between p-5 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md transition-all duration-200"
              >
                {/* Left Section: Job Details & Badges */}
                <div className="flex flex-col mb-4 md:mb-0 max-w-2xl">
                  <h3 className="font-bold text-lg text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {job.title}
                  </h3>
                  <p className="text-slate-500 font-medium mb-3">
                    Company: {job.company}
                  </p>

                  {/* Metadata Badges */}
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    {/* Defensive Location Check */}
                    {job.location &&
                    job.location !== "Not Specified" &&
                    job.location.trim() !== "" ? (
                      <div className="flex items-center gap-1.5 text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        <span className="font-medium">{job.location}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                        <span className="font-medium">
                          Location Unspecified
                        </span>
                      </div>
                    )}
                   
                    {job.jobType ? (
                      <div className="flex items-center text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 font-medium">
                        {job.jobType.replace("_", " ")}
                      </div>
                    ) : null}

                    {/* Defensive Experience Level Check */}
                    {job.experienceLevel ? (
                      <div className="flex items-center text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200 font-medium">
                        {job.experienceLevel}
                      </div>
                    ) : null}
                  </div>

                  {/* Defensive Skills Array Check */}
                  {job.skills && job.skills.length > 0 && (
                    <div className="flex gap-2 flex-wrap mt-4">
                      {job.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="bg-slate-50 border border-slate-300 text-slate-700 text-xs px-2.5 py-1 rounded-full font-semibold"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Section: Actions & Date */}
                <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 shrink-0 mt-4 md:mt-0">
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
