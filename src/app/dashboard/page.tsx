import { auth } from "../auth";
import { prisma } from "@/app/lib/prisma";
import { redirect } from "next/navigation";
import AddJobForm from "../components/AddJobForm";
import SignOut from "../components/SignOut";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/");
  }

  const userJobs = await prisma.job.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="min-h-screen p-6 md:p-12 max-w-4xl mx-auto space-y-10">
      {/* Header Section */}
      <header className="flex justify-between items-center border-b sticky top-0 z-50 bg-slate-50/80 backdrop-blur-md border-slate-200 py-4">
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
   
      <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <AddJobForm />
      </section>

      <section>
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          Your Tracked Jobs
          <span className="bg-slate-100 text-slate-600 text-xs py-1 px-2 rounded-full font-medium">
            {userJobs.length}
          </span>
        </h2>

        {userJobs.length === 0 ? (
          <div className="text-center p-10 bg-white border border-dashed border-slate-300 rounded-xl">
            <p className="text-slate-500 font-medium">
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
                <div className="flex flex-col">
                  <h3 className="font-bold text-lg text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {job.title}
                  </h3>
                  <p className="text-slate-500 font-medium">{job.company}</p>
                </div>

                <div className="mt-4 md:mt-0 flex items-center gap-4">
                  <span className="text-xs font-bold px-3 py-1.5 rounded-md bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/10 uppercase tracking-wider">
                    {job.status}
                  </span>
                  <span className="text-sm text-slate-400 font-medium">
                    {job.createdAt.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
