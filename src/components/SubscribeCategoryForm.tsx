"use client";

import { useState } from "react";

export default function SubscribeCategoryForm({ categories }: { categories: string[] }) {
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState(categories[0] || "");
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, category }),
    });
    if (!res.ok) {
      setMsg("Subscription failed");
      return;
    }
    setMsg("Subscribed to weekly digest ✅");
    setEmail("");
  }

  return (
    <section className="glass mt-10 rounded-2xl p-5">
      <h2 className="ui-h2 mb-2 text-2xl font-bold text-white">Subscribe to Category Digest</h2>
      <p className="mb-4 text-sm text-slate-300">Get a weekly email for your selected category.</p>
      <form onSubmit={submit} className="grid gap-3 md:grid-cols-3">
        <input className="ui-input" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required type="email" />
        <select className="ui-input" value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((c) => (
            <option key={c} value={c} className="text-slate-900 bg-white">{c}</option>
          ))}
        </select>
        <button className="rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 px-4 py-2 text-sm font-medium text-white">Subscribe</button>
      </form>
      {msg ? <p className="mt-3 text-sm text-cyan-300">{msg}</p> : null}
    </section>
  );
}
