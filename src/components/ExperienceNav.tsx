import Link from "next/link";

export default function ExperienceNav({ code }: { code: string }) {
  const base = `/experience/${encodeURIComponent(code)}`;
  return (
    <nav className="glass mb-4 flex flex-wrap gap-2 rounded-xl p-2 text-sm">
      <Link className="rounded-lg border border-white/20 px-3 py-1 text-slate-200" href={base}>Home</Link>
      <Link className="rounded-lg border border-white/20 px-3 py-1 text-slate-200" href={`${base}/brief`}>Brief</Link>
      <Link className="rounded-lg border border-white/20 px-3 py-1 text-slate-200" href={`${base}/challenges`}>Game/Challenges</Link>
      <Link className="rounded-lg border border-white/20 px-3 py-1 text-slate-200" href={`${base}/leaderboard`}>Leaderboard/Activity</Link>
    </nav>
  );
}
