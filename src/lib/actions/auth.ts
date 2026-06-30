"use server";

import { authenticate, createSession, destroySession } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function loginAction(
  _prevState: { error: string } | null,
  formData: FormData
) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!username || !password) {
    return { error: "Please enter both username and password." };
  }

  const isValid = await authenticate(username, password);
  if (!isValid) {
    return { error: "Invalid username or password." };
  }

  await createSession();
  redirect("/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function getOwnerName() {
  return process.env.ADMIN_USERNAME || "Owner";
}
