import { auth } from "./auth";
import SignIn from "./components/SignIn";
import SignOut from "./components/SignOut";
export default async function Home() {
  const session = await auth();
  return (
    <main className="p-10">
      <h1 className="text-3xl font-bold mb-5">
        CareerSync AI - Component Auth Test
      </h1>

      {session?.user ? (
        <div className="p-5 border-2 border-green-500 rounded">
          <p className="text-xl">Welcome, {session.user.name}</p>
          <p className="text-sm text-gray-500 mb-4">{session.user.email}</p>
          <SignOut />
        </div>
      ) : (
        <div className="p-5 border-2 border-red-500 rounded">
          <p className="mb-4">You are not logged in.</p>
          <SignIn />
        </div>
      )}
    </main>
  );
}
