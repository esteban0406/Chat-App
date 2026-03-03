"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register } from "@/lib/auth";
import { useTranslation } from "react-i18next";

export default function SignUpPage() {
  const router = useRouter();
  const { t } = useTranslation("auth");
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
      router.push("/home");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("registerError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-xl font-bold text-center">{t("signupTitle")}</h2>

        <input
          type="text"
          placeholder={t("username")}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="w-full px-3 py-2 rounded bg-surface text-white focus:outline-none focus:ring-2 focus:ring-gold"
        />
        <input
          type="email"
          placeholder={t("email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 rounded bg-surface text-white focus:outline-none focus:ring-2 focus:ring-gold"
        />
        <input
          type="password"
          placeholder={t("password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-3 py-2 rounded bg-surface text-white focus:outline-none focus:ring-2 focus:ring-gold"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gold hover:bg-gold/90 py-2 rounded text-deep font-semibold disabled:opacity-50"
        >
          {loading ? t("registering") : t("signup")}
        </button>

        {error ? <p className="text-ruby text-center text-sm">{error}</p> : null}
      </form>

      <div className="flex items-center my-4">
        <hr className="flex-grow border-border" />
        <span className="px-2 text-text-muted">{t("or")}</span>
        <hr className="flex-grow border-border" />
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={() => {
            window.location.href = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/google`;
          }}
          className="w-full bg-ruby hover:bg-ruby/90 py-2 rounded text-white font-semibold"
        >
          {t("continueWithGoogle")}
        </button>
        <button
          disabled
          className="w-full bg-gold hover:bg-gold/90 py-2 rounded text-deep font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t("continueWithMicrosoft")}
        </button>
      </div>

      <div className="mt-4 text-center text-sm">
        {t("hasAccount")}{" "}
        <Link
          href="/login"
          className="text-gold hover:underline focus:outline-none"
        >
          {t("logInLink")}
        </Link>
      </div>
    </div>
  );
}
