"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/lib/auth";

/** Redirect to /login once we know there is no session. */
export function useRequireAuth() {
  const { session, ready } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (ready && !session) router.replace("/login");
  }, [ready, session, router]);
  return { session, ready };
}
