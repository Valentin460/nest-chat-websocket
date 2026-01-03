"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import AuthForm from "@/components/AuthForm";

export default function Home() {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/chat");
    }
  }, [user, router]);

  if (user) return null;

  return <AuthForm />;
}
