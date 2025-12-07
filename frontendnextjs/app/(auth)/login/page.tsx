// app/(auth)/login/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false, // we'll handle redirect manually
    });

    setLoading(false);

    if (!res) {
      setError("Unexpected error");
      return;
    }

    if (res.error) {
      setError(res.error || "Invalid credentials");
      return;
    }

    // ✅ Logged in
    router.push("/servers"); // or /friends, /servers, etc.
    router.refresh();
  };

  const handleOAuthLogin = async (provider: "google" | "azure-ad") => {
    await signIn(provider, {
      callbackUrl: "/servers", // where to go after OAuth
    });
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-xl font-semibold text-center">Login</h2>

        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-2 rounded bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full p-2 rounded bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full p-2 bg-indigo-600 rounded hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading ? "Ingresando..." : "Login"}
        </button>

        {error && <p className="text-red-400 text-sm">{error}</p>}
      </form>

      {/* 🔹 Separator */}
      <div className="flex items-center my-4">
        <hr className="flex-grow border-gray-600" />
        <span className="px-2 text-gray-400">o</span>
        <hr className="flex-grow border-gray-600" />
      </div>

      {/* 🔹 OAuth buttons */}
      <div className="flex flex-col gap-3">
        <button
          onClick={() => handleOAuthLogin("google")}
          className="w-full bg-red-500 hover:bg-red-600 py-2 rounded text-white font-semibold"
        >
          Continuar con Google
        </button>
        <button
          onClick={() => handleOAuthLogin("azure-ad")}
          className="w-full bg-indigo-600 hover:bg-indigo-700 py-2 rounded text-white font-semibold"
        >
          Continuar con Microsoft
        </button>
      </div>

      <div className="mt-4 text-center text-sm">
        ¿No tienes cuenta?{" "}
        <Link
          href="/signup"
          className="text-[#7289da] hover:underline focus:outline-none"
        >
          Regístrate
        </Link>
      </div>
    </div>
  );
}
