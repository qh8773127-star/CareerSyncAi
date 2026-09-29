import { signOut } from "../auth";

const SignOut = () => {
  return (
    <form
      action={async () => {
        "use server";
        await signOut();
      }}
    >
      <button type="submit" className="bg-red-500 text-white px-4 py-2 rounded">
        Logout
      </button>
    </form>
  );
};

export default SignOut;
