"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setToken } from "@/lib/auth";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      setToken(token);
      router.replace("/home");
    } else {
      router.replace("/login");
    }
  }, [router, searchParams]);

  return (
    <div className="flex h-screen items-center justify-center bg-deep text-white">
      <p>Autenticando...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-deep text-white">
          <p>Autenticando...</p>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
