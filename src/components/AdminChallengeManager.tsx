"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { CHALLENGE_TYPES, EVIDENCE_MODES } from "@/lib/challenge-types";

type Challenge = { id: string; title: string; description: string; points: number; enabled: boolean; isToday: boolean; type: string; evidenceMode: string; autoApproveAnswer: string | null };
type Submission = { id: string; participantName: string; challengeTitle: string; evidenceText: string | null; evidenceUrl: string | null; evidenceFileUrl: string | null; status: string };

export default function AdminChallengeManager({ eventId, challenges, submissions }: { eventId: string; challenges: Challenge[]; submissions: Submission[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ title: "", description: "", type: "QUIZ", evidenceMode: "TEXT", autoApproveAnswer: "", points: 10, enabled: true, isToday: false });
  const [working, setWorking] = useState(false);

  const btn = "inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold transition hover:-translate-y-0.5 disabled:opacity-50";

  async function parseResponse(res: Response) {
    const raw = await res.text();
    if (!raw) return {};
    try { return JSON.parse(raw); } catch { return {}; }
  }

  async function create(e: FormEvent) {
    e.preventDefault();
    setWorking(true);
    const res = await fetch("/api/challenges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, eventId }),
    });
    const j = await parseResponse(res);
    setWorking(false);
    if (!res.ok) {
      alert(j.error || "Could not create challenge");
      return;
    }
    setForm({ title: "", description: "", type: "QUIZ", evidenceMode: "TEXT", autoApproveAnswer: "", points: 10, enabled: true, isToday: false });
    router.refresh();
  }

  async function toggle(id: string, data: Partial<Challenge>) {
    setWorking(true);
    const res = await fetch(`/api/challenges/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const j = await parseResponse(res);
    setWorking(false);
    if (!res.ok) {
      alert(j.error || "Could not update challenge");
      return;
    }
    router.refresh();
  }

  async function editChallenge(c: Challenge) {
    const title = prompt("Title", c.title);
    if (!title) return;
    const description = prompt("Description", c.description);
    if (!description) return;
    const pointsStr = prompt("Points", String(c.points));
    if (!pointsStr) return;

    await toggle(c.id, { title, description, points: Number(pointsStr) });
  }

  async function approve(submissionId: string) {
    const note = prompt("Approval note (optional)", "Approved") || "Approved";
    setWorking(true);
    await fetch(`/api/challenges/submissions/${submissionId}/approve`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ note }) });
    setWorking(false);
    router.refresh();
  }

  async function deny(submissionId: string) {
    const reason = prompt("Reason for denial", "Evidence not sufficient") || "Rejected by admin";
    setWorking(true);
    await fetch(`/api/challenges/submissions/${submissionId}/deny`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason }) });
    setWorking(false);
    router.refresh();
  }

  return (
    <section className="glass mt-6 rounded-2xl p-4">
      <h2 className="mb-3 text-xl font-semibold text-white">Challenges</h2>
      <p className="mb-2 text-xs text-slate-400">Types: {CHALLENGE_TYPES.join(", ")} | Evidence: {EVIDENCE_MODES.join(", ")}</p>
      <form onSubmit={create} className="grid gap-2 md:grid-cols-2">
        <input className="ui-input" placeholder="Challenge title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
        <input className="ui-input" placeholder="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        <select className="ui-input" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>{CHALLENGE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select>
        <select className="ui-input" value={form.evidenceMode} onChange={(e) => setForm((f) => ({ ...f, evidenceMode: e.target.value }))}>{EVIDENCE_MODES.map((m) => <option key={m} value={m}>{m}</option>)}</select>
        {form.evidenceMode === "SHORT_ANSWER" ? <input className="ui-input md:col-span-2" placeholder="Pre-approved answer (case-insensitive)" value={form.autoApproveAnswer} onChange={(e) => setForm((f) => ({ ...f, autoApproveAnswer: e.target.value }))} /> : null}
        <input className="ui-input" type="number" min={1} value={form.points} onChange={(e) => setForm((f) => ({ ...f, points: Number(e.target.value || 1) }))} />
        <label className="flex items-center gap-2 text-sm text-slate-200"><input type="checkbox" checked={form.enabled} onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))} /> Enabled</label>
        <button disabled={working} className="rounded-lg bg-violet-600 px-3 py-2 text-white md:col-span-2">Add Challenge</button>
      </form>

      <div className="mt-4 space-y-2">
        {challenges.map((c) => (
          <div key={c.id} className="rounded border border-white/10 bg-slate-950/40 p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-white">{c.title} <span className="text-cyan-300">({c.points} pts)</span> <span className="text-xs text-violet-300">[{c.type}] [{c.evidenceMode}]</span></p>
                <p className="text-sm text-slate-300">{c.description}</p>
                {c.evidenceMode === "SHORT_ANSWER" ? <p className="text-xs text-emerald-300">Pre-approved answer: {c.autoApproveAnswer || "(none)"}</p> : null}
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggle(c.id, { enabled: !c.enabled })} className={`${btn} border-white/25 bg-slate-500/20 text-slate-100 hover:bg-slate-500/35`}>{c.enabled ? "Disable" : "Enable"}</button>
                <button onClick={() => toggle(c.id, { isToday: true })} className={`${btn} border-cyan-300/35 bg-cyan-500/20 text-cyan-100 hover:bg-cyan-500/35`}>Set Today</button>
                <button onClick={() => editChallenge(c)} className={`${btn} border-violet-300/35 bg-violet-500/20 text-violet-100 hover:bg-violet-500/35`}>Edit</button>
              </div>
            </div>
            <p className="mt-1 text-xs text-slate-400">{c.enabled ? "Enabled" : "Disabled"} {c.isToday ? "• Today" : ""}</p>
          </div>
        ))}
      </div>

      <h3 className="mt-6 mb-2 text-lg font-semibold text-white">Pending Submissions</h3>
      <div className="space-y-2">
        {submissions.length ? submissions.map((s) => (
          <div key={s.id} className="rounded border border-amber-300/25 bg-amber-900/15 p-3">
            <p className="text-sm text-white"><span className="font-semibold">{s.participantName}</span> submitted for <span className="text-cyan-300">{s.challengeTitle}</span></p>
            {s.evidenceFileUrl ? <a href={s.evidenceFileUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-cyan-300 underline">View uploaded photo</a> : null}
            {s.evidenceUrl ? <a href={s.evidenceUrl} target="_blank" rel="noreferrer" className="mt-1 ml-3 inline-block text-xs text-cyan-300 underline">View URL evidence</a> : null}
            {s.evidenceText ? <p className="mt-1 text-xs text-slate-300">Answer: {s.evidenceText}</p> : null}
            {!s.evidenceText && !s.evidenceUrl && !s.evidenceFileUrl ? <p className="mt-1 text-xs text-slate-400">No evidence attached</p> : null}
            <div className="mt-2 flex gap-2">
              <button disabled={working} onClick={() => approve(s.id)} className={`${btn} border-emerald-300/40 bg-emerald-500/25 text-emerald-100 hover:bg-emerald-500/40`}>Approve + Points</button>
              <button disabled={working} onClick={() => deny(s.id)} className={`${btn} border-rose-300/40 bg-rose-500/25 text-rose-100 hover:bg-rose-500/40`}>Deny</button>
            </div>
          </div>
        )) : <p className="text-sm text-slate-400">No pending submissions.</p>}
      </div>
    </section>
  );
}
