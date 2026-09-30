import { logoutUser } from "../actions/auth-actions";

const SignOut = () => {
  return (
    <form
      action={logoutUser}
    >
      <button type="submit" className="bg-red-500 text-white px-4 py-2 rounded">
        Logout
      </button>
    </form>
  );
};

export default SignOut;
