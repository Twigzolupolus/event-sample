"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (!res.ok) {
      setError("Invalid password");
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="glass neon-ring mx-auto max-w-md rounded-2xl p-6">
      <p className="mb-1 text-xs uppercase tracking-[0.2em] text-cyan-200">Secure Access</p>
      <h1 className="mb-4 text-2xl font-bold text-white">Admin Console</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Admin password"
          className="w-full rounded-xl border border-white/20 bg-slate-950/60 px-3 py-2 text-white outline-none ring-violet-400/60 placeholder:text-slate-400 focus:ring"
        />
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        <button className="w-full rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 px-3 py-2 font-medium text-white">
          Sign in
        </button>
      </form>
    </div>
  );
}
