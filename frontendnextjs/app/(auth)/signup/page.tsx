// app/(auth)/signup/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/app/lib/auth-client";

type OAuthProvider = "google" | "microsoft-entra-id";

const getErrorMessage = (result: any) =>
  result?.error ? result.error?.message || String(result.error) : null;

export default function SignUpPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await authClient.signUp.email({
      name: username,
      email,
      password,
    });

    setLoading(false);

    if (!result || result.error) {
      setError(getErrorMessage(result) || "Error al registrarse");
      return;
    }

    router.push("/friends");
    router.refresh();
  };

  const handleOAuthSignUp = async (provider: OAuthProvider) => {
    setLoading(true);
    setError(null);

    const result = await authClient.signIn.social({
      provider,
      callbackURL: `${window.location.origin}/friends`,
      errorCallbackURL: `${window.location.origin}/signup`,
    });

    setLoading(false);

    if (!result || result.error) {
      setError(getErrorMessage(result) || "No se pudo continuar con OAuth");
      return;
    }

    const redirectUrl = (result as any)?.data?.url;
    const shouldRedirect = (result as any)?.data?.redirect !== false;
    if (redirectUrl && shouldRedirect) {
      window.location.href = redirectUrl;
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-xl font-bold text-center">Registrarse</h2>

        <input
          type="text"
          placeholder="Nombre de usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="w-full px-3 py-2 rounded bg-gray-700 text-white focus:outline-none"
        />
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 rounded bg-gray-700 text-white focus:outline-none"
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-3 py-2 rounded bg-gray-700 text-white focus:outline-none"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded text-white font-semibold disabled:opacity-50"
        >
          {loading ? "Registrando..." : "Registrarse"}
        </button>

        {error && <p className="text-red-400 text-center text-sm">{error}</p>}
      </form>

      <div className="flex items-center my-4">
        <hr className="flex-grow border-gray-600" />
        <span className="px-2 text-gray-400">o</span>
        <hr className="flex-grow border-gray-600" />
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={() => handleOAuthSignUp("google")}
          className="w-full bg-red-500 hover:bg-red-600 py-2 rounded text-white font-semibold"
        >
          Continuar con Google
        </button>
        <button
          onClick={() => handleOAuthSignUp("microsoft-entra-id")}
          className="w-full bg-indigo-600 hover:bg-indigo-700 py-2 rounded text-white font-semibold"
        >
          Continuar con Microsoft
        </button>
      </div>

      <div className="mt-4 text-center text-sm">
        ¿Ya tienes cuenta?{" "}
        <Link
          href="/login"
          className="text-[#7289da] hover:underline focus:outline-none"
        >
          Inicia sesión
        </Link>
      </div>
    </div>
  );
}

