"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

export default function JoinPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const c = sp.get("code");
    if (c) setCode(c.toUpperCase());
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, name }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Unable to join event");
      return;
    }
    if (data.alreadyJoined) {
      router.push(`/experience/${encodeURIComponent(data.code)}`);
      return;
    }
    router.push(`/join/success?code=${encodeURIComponent(data.code)}`);
  }

  return (
    <div className="glass mx-auto max-w-md rounded-2xl p-6">
      <h1 className="text-2xl font-bold text-white">Join Event</h1>
      <p className="mt-1 text-sm text-slate-300">Enter your name and event code.</p>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="ui-input" />
        <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="EV-XXXXXX" className="ui-input text-center text-lg tracking-wider" />
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        <button disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 px-4 py-2 text-white">{loading ? "Joining..." : "Join Event"}</button>
      </form>
    </div>
  );
}
