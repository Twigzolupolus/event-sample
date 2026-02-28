"use client";

import { useMemo, useState } from "react";

type Challenge = { id: string; title: string; description: string; points: number; enabled: boolean; isToday: boolean; type: string; evidenceMode: string };
type SubmissionInfo = { challengeId: string; status: "PENDING" | "APPROVED" | "REJECTED"; reviewNote: string | null };

export default function ChallengeBoard({ challenges, completedIds, submissions }: { challenges: Challenge[]; completedIds: string[]; submissions: SubmissionInfo[] }) {
  const [total, setTotal] = useState<number | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [localCompleted, setLocalCompleted] = useState<string[]>([]);
  const [localSubmissions, setLocalSubmissions] = useState<SubmissionInfo[]>([]);
  const [evidenceText, setEvidenceText] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({});

  const doneSet = useMemo(() => new Set([...completedIds, ...localCompleted]), [completedIds, localCompleted]);
  const submissionMap = useMemo(() => {
    const m = new Map<string, SubmissionInfo>();
    [...submissions, ...localSubmissions].forEach((s) => m.set(s.challengeId, s));
    return m;
  }, [submissions, localSubmissions]);

  async function uploadFile(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/uploads", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");
    return data.url as string;
  }

  async function submitChallenge(id: string, mode: string) {
    if (doneSet.has(id)) return;
    const existing = submissionMap.get(id);
    if (existing?.status === "PENDING") return;

    setBusy(id);
    let payload: Record<string, string | null> = {};

    if (mode === "PHOTO_UPLOAD") {
      const f = files[id];
      if (!f) {
        setBusy(null);
        alert("Please upload a photo evidence file.");
        return;
      }
      try {
        const uploaded = await uploadFile(f);
        payload.evidenceFileUrl = uploaded;
      } catch {
        setBusy(null);
        alert("Photo upload failed.");
        return;
      }
    } else if (mode === "URL") {
      payload.evidenceUrl = evidenceText[id] || null;
    } else {
      payload.evidenceText = evidenceText[id] || null;
    }

    const res = await fetch(`/api/challenges/${id}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setBusy(null);

    if (!res.ok) {
      alert(data.error || "Failed to submit challenge");
      return;
    }

    if (data.already || data.approved) {
      setLocalCompleted((s) => (s.includes(id) ? s : [...s, id]));
      setTotal(data.total ?? null);
      alert(data.auto ? "Auto-approved! Points added." : "Approved and counted.");
      return;
    }

    if (data.rejected) {
      setLocalSubmissions((s) => [...s.filter((x) => x.challengeId !== id), { challengeId: id, status: "REJECTED", reviewNote: data.reason || null }]);
      alert(`Denied: ${data.reason || "Rejected"}`);
      return;
    }

    if (data.pending) {
      setLocalSubmissions((s) => [...s.filter((x) => x.challengeId !== id), { challengeId: id, status: "PENDING", reviewNote: null }]);
      alert("Submitted for admin approval.");
      return;
    }
  }

  return (
    <div className="space-y-3">
      {total !== null ? <p className="text-sm text-cyan-300">Your total points: {total}</p> : null}
      {challenges.length ? challenges.map((c) => {
        const done = doneSet.has(c.id);
        const sub = submissionMap.get(c.id);
        const pending = sub?.status === "PENDING";
        const rejected = sub?.status === "REJECTED";

        return (
          <div key={c.id} className="glass rounded-xl p-4">
            <p className="font-semibold text-white">{c.title} {c.isToday ? <span className="text-violet-300">• Today</span> : null} <span className="text-xs text-violet-300">[{c.type}] [{c.evidenceMode}]</span></p>
            <p className="text-sm text-slate-300">{c.description}</p>
            <p className="mt-1 text-xs text-cyan-300">{c.points} points</p>

            {c.evidenceMode === "PHOTO_UPLOAD" ? (
              <label className="mt-2 block rounded-lg border border-cyan-300/30 bg-cyan-500/10 p-3 text-sm text-cyan-100">
                <span className="mb-2 block text-xs uppercase tracking-wide">Upload photo evidence</span>
                <input type="file" accept="image/*" className="block w-full text-sm text-white file:mr-3 file:rounded file:border-0 file:bg-cyan-400 file:px-3 file:py-1 file:font-semibold file:text-slate-900 hover:file:bg-cyan-300" onChange={(e) => setFiles((m) => ({ ...m, [c.id]: e.target.files?.[0] || null }))} />
              </label>
            ) : (
              <input className="ui-input mt-2" placeholder={c.evidenceMode === "URL" ? "Evidence URL" : c.evidenceMode === "SHORT_ANSWER" ? "Short answer" : "Text evidence"} value={evidenceText[c.id] || ""} onChange={(e) => setEvidenceText((m) => ({ ...m, [c.id]: e.target.value }))} />
            )}

            {rejected ? <p className="mt-2 text-xs text-rose-300">Denied: {sub?.reviewNote || "No reason provided"}</p> : null}
            {pending ? <p className="mt-2 text-xs text-amber-300">Pending admin approval...</p> : null}
            {pending && sub?.reviewNote ? <p className="mt-1 text-xs text-rose-300">Last denial reason: {sub.reviewNote}</p> : null}

            <button
              disabled={done || pending || busy === c.id}
              onClick={() => submitChallenge(c.id, c.evidenceMode)}
              className="mt-3 rounded-lg bg-violet-500 px-3 py-1 text-sm font-semibold text-white hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {done ? "Completed" : pending ? "Pending Approval" : busy === c.id ? "Submitting..." : rejected ? "Resubmit" : "Submit for approval"}
            </button>
          </div>
        );
      }) : <p className="text-slate-300">No enabled challenges yet.</p>}
    </div>
  );
}
