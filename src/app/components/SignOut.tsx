import { logoutUser } from "../actions/auth-actions";

const SignOut = () => {
  return (
    <form action={logoutUser}>
      <button type="submit" className=" text-black cursor-pointer hover:bg-slate-100 px-4 py-2 rounded">
        Logout
      </button>
    </form>
  );
};

export default SignOut;
