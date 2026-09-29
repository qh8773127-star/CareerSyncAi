import { signIn } from "../auth";

const SignIn = () => {
  return (
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
  );
};

export default SignIn;
