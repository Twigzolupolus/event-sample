"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function JoinSuccessPage() {
  const [code, setCode] = useState("");

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setCode(sp.get("code") || "");
  }, []);

  return (
    <div className="glass mx-auto max-w-md rounded-2xl p-6 text-center">
      <h1 className="text-2xl font-bold text-emerald-300">You’re in! ✅</h1>
      <p className="mt-2 text-slate-300">You have joined event <span className="font-semibold text-cyan-300">{code}</span>.</p>
      <Link href={`/experience/${encodeURIComponent(code)}`} className="mt-5 inline-block rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 px-4 py-2 text-white">
        Go Home
      </Link>
    </div>
  );
}
