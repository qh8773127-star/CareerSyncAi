import { auth } from "./auth";
import { redirect } from "next/navigation";
import LandingPageClient from "./components/LandingPageClient";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }
  return <LandingPageClient />;
}