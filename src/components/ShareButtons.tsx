"use client";

export default function ShareButtons({ url }: { url: string }) {
  async function copy() {
    await navigator.clipboard.writeText(url);
    alert("Link copied");
  }

  return (
    <div className="flex gap-2">
      <button onClick={copy} className="rounded-lg border border-white/20 px-3 py-1 text-sm text-slate-200">Copy link</button>
      <a href={url} target="_blank" rel="noreferrer" className="rounded-lg border border-white/20 px-3 py-1 text-sm text-slate-200">Open new tab</a>
    </div>
  );
}
