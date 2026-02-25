"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "@/lib/auth";

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

    try {
      await login(email, password);
      router.push("/home");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid credentials");
    } finally {
      setLoading(false);
    }
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
          className="w-full p-2 rounded bg-surface focus:outline-none focus:ring-2 focus:ring-gold"
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full p-2 rounded bg-surface focus:outline-none focus:ring-2 focus:ring-gold"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full p-2 bg-gold rounded text-deep hover:bg-gold/90 disabled:opacity-50"
        >
          {loading ? "Ingresando..." : "Login"}
        </button>

        {error ? <p className="text-ruby text-sm">{error}</p> : null}
      </form>

      <div className="flex items-center my-4">
        <hr className="flex-grow border-border" />
        <span className="px-2 text-text-muted">o</span>
        <hr className="flex-grow border-border" />
      </div>

      <div className="flex flex-col gap-3">
        <button
          disabled
          className="w-full bg-ruby hover:bg-ruby/90 py-2 rounded text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continuar con Google
        </button>
        <button
          disabled
          className="w-full bg-gold hover:bg-gold/90 py-2 rounded text-deep font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continuar con Microsoft
        </button>
      </div>

      <div className="mt-4 text-center text-sm">
        ¿No tienes cuenta?{" "}
        <Link
          href="/signup"
          className="text-gold hover:underline focus:outline-none"
        >
          Regístrate
        </Link>
      </div>
    </div>
  );
}
