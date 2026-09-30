"use server"
import {signIn, signOut } from "../auth";

export async function loginWithGithub(){
    await signIn("github",{ redirectTo: "/dashboard" });
}
export async function loginWithGoogle() {
  await signIn("google",{ redirectTo: "/dashboard" });
}

export async function logoutUser() {
  await signOut({ redirectTo: "/" });
}
