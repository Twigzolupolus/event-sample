"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onLogout() {
    if (busy) return;
    setBusy(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      router.push("/");
      router.refresh();
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onLogout}
      className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-slate-200"
      disabled={busy}
    >
      {busy ? "Logging out..." : "Logout"}
    </button>
  );
}
