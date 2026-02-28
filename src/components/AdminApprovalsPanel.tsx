"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Row = { id: string; eventTitle: string; challengeTitle: string; participantName: string; evidenceText: string | null; evidenceUrl: string | null; evidenceFileUrl: string | null };

export default function AdminApprovalsPanel({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [working, setWorking] = useState(false);
  const btn = "inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold transition hover:-translate-y-0.5 disabled:opacity-50";

  async function approve(id: string) {
    const note = prompt("Approval note", "Approved") || "Approved";
    setWorking(true);
    await fetch(`/api/challenges/submissions/${id}/approve`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ note }) });
    setWorking(false);
    router.refresh();
  }

  async function deny(id: string) {
    const reason = prompt("Reason for denial", "Evidence not sufficient") || "Rejected by admin";
    setWorking(true);
    await fetch(`/api/challenges/submissions/${id}/deny`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason }) });
    setWorking(false);
    router.refresh();
  }

  return (
    <div className="space-y-2">
      {rows.length ? rows.map((r) => (
        <div key={r.id} className="glass rounded-xl p-3">
          <p className="text-sm text-white"><span className="font-semibold">{r.participantName}</span> • {r.eventTitle} • {r.challengeTitle}</p>
          {r.evidenceFileUrl ? <a href={r.evidenceFileUrl} target="_blank" rel="noreferrer" className="text-xs text-cyan-300 underline">Uploaded photo</a> : null}
          {r.evidenceUrl ? <a href={r.evidenceUrl} target="_blank" rel="noreferrer" className="ml-2 text-xs text-cyan-300 underline">URL evidence</a> : null}
          {r.evidenceText ? <p className="mt-1 text-xs text-slate-300">Text: {r.evidenceText}</p> : null}
          <div className="mt-2 flex gap-2">
            <button disabled={working} onClick={() => approve(r.id)} className={`${btn} border-emerald-300/40 bg-emerald-500/25 text-emerald-100 hover:bg-emerald-500/40`}>Approve</button>
            <button disabled={working} onClick={() => deny(r.id)} className={`${btn} border-rose-300/40 bg-rose-500/25 text-rose-100 hover:bg-rose-500/40`}>Deny</button>
          </div>
        </div>
      )) : <p className="text-slate-400">No pending approvals.</p>}
    </div>
  );
}
