import Link from "next/link";
import { db } from "@/lib/db";
import AdminApprovalsPanel from "@/components/AdminApprovalsPanel";

export default async function AdminApprovalsPage() {
  const rows = await db.challengeSubmission.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
    include: { challenge: { include: { event: true } } },
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Pending Challenge Approvals</h1>
        <Link href="/admin" className="rounded-lg border border-white/20 px-3 py-1 text-sm text-slate-200">Back to admin</Link>
      </div>
      <AdminApprovalsPanel rows={rows.map((r) => ({ id: r.id, eventTitle: r.challenge.event.title, challengeTitle: r.challenge.title, participantName: r.participantName, evidenceText: r.evidenceText, evidenceUrl: r.evidenceUrl, evidenceFileUrl: r.evidenceFileUrl }))} />
    </div>
  );
}
