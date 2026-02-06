"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register } from "@/lib/auth";

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

    try {
      await register(email, password, username);
      router.push("/friends");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrarse");
    } finally {
      setLoading(false);
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
          disabled
          className="w-full bg-red-500 hover:bg-red-600 py-2 rounded text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continuar con Google
        </button>
        <button
          disabled
          className="w-full bg-indigo-600 hover:bg-indigo-700 py-2 rounded text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
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
