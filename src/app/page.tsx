import { auth } from "./auth";
import { redirect } from "next/navigation";
import SignIn from "./components/SignIn";

export default async function HomePage() {
  const session = await auth();
  
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
  
    <main className="min-h-screen flex items-center justify-center p-6">
      
      
      <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-sm border border-slate-200 text-center space-y-8">
        
        <div className="space-y-3">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
            CareerSync AI
          </h1>
          <p className="text-slate-500 font-medium">
            Track your job applications and manage your career like a pro.
          </p>
        </div>
        <SignIn />
        
      </div>
      
    </main>
  );
}