import { signIn } from "../auth";

const SignIn = () => {
  return (
    <div className="flex flex-col gap-4 items-center">
    <form
      action={async () => {
        "use server";
        await signIn("github");
      }}
    >
      <button type="submit" className="bg-black text-white px-4 py-2 rounded">
        Login with GitHub
      </button>
    </form>

    
    <form
      action={async () => {
        "use server";
        await signIn("google");
      }}
    >
      <button type="submit" className="bg-red-500 text-white px-4 py-2 rounded">
        Login with Google
      </button>
    </form>
    </div>
  );
};

export default SignIn;
