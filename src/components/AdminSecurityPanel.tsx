"use client";

import { FormEvent, useState } from "react";

export default function AdminSecurityPanel() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [backupMsg, setBackupMsg] = useState<string | null>(null);

  async function rotate(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    const res = await fetch("/api/admin/rotate-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Failed to rotate password");
      return;
    }
    setMessage("Password rotated successfully.");
    setCurrentPassword("");
    setNewPassword("");
  }

  async function backupNow() {
    setBackupMsg(null);
    const res = await fetch("/api/admin/backup", { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setBackupMsg(data.error || "Backup failed");
      return;
    }
    setBackupMsg(`Backup created: ${data.file}`);
  }

  return (
    <section className="glass mt-8 rounded-2xl p-4">
      <h2 className="ui-h2 mb-3 text-xl font-semibold text-white">Security & Ops</h2>

      <form onSubmit={rotate} className="grid gap-2 md:grid-cols-3">
        <input className="ui-input" type="password" placeholder="Current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        <input className="ui-input" type="password" placeholder="New password (min 8)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        <button className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white">Rotate passcode</button>
      </form>
      {message ? <p className="mt-2 text-sm text-slate-300">{message}</p> : null}

      <div className="mt-4 flex items-center gap-3">
        <button onClick={backupNow} className="rounded-lg border border-white/20 px-3 py-2 text-sm text-slate-200">Run backup now</button>
        {backupMsg ? <p className="text-sm text-slate-300">{backupMsg}</p> : null}
      </div>
      <p className="mt-2 text-xs text-slate-400">Tip: schedule daily backups using <code>npm run backup:db</code> in cron.</p>
    </section>
  );
}
