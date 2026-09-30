import { auth } from "../auth";
import { redirect } from "next/navigation";
import SignOut from "../components/SignOut";

export default async function DashboardPage() {
  // Bouncer se guzarne ke baad andar aakar user ka ID card (session) check karna
  const session = await auth();

  // Agar ghalti se koi nanga user andar aa gaya (bina login ke), toh usay bahar phenk do
 if (!session) {
    redirect("/"); // Ab NextAuth ke default page par nahi, seedha Home par bhejega
  }

  // Agar user strictly login hai, toh uska data UI par render kar
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-3xl font-bold">Welcome to Protected Dashboard!</h1>
      
      <div className="bg-gray-100 p-6 rounded-lg text-black">
        <p><strong>Name:</strong> {session.user?.name}</p>
        <p><strong>Email:</strong> {session.user?.email}</p>
      </div>
      <SignOut/>
    </div>
  );
}