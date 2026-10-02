"use client";

import { loginWithGithub, loginWithGoogle } from "../actions/auth-actions";
import { useFormStatus } from "react-dom";

const AuthButton = ({ label, bgColor }: { label: string; bgColor: string }) => {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`w-64 flex justify-center items-center px-6 py-2.5 rounded-lg font-semibold text-white transition-all shadow-sm ${bgColor} disabled:opacity-60 disabled:cursor-not-allowed`}
    >
      {pending ? "Authenticating..." : label}
    </button>
  );
};


const SignIn = () => {
  return (
    <div className="flex flex-col gap-4 items-center w-full">
      
      {/* GitHub Auth Pipeline */}
      <form action={loginWithGithub}>
        <AuthButton 
          label="Continue with GitHub" 
          bgColor="bg-slate-900 hover:bg-slate-800 ring-1 ring-slate-900" 
        />
      </form>

      {/* Google Auth Pipeline */}
      <form action={loginWithGoogle}>
        <AuthButton 
          label="Continue with Google" 
          bgColor="bg-red-500 hover:bg-red-600 ring-1 ring-red-500" 
        />
      </form>

    </div>
  );
};

export default SignIn;