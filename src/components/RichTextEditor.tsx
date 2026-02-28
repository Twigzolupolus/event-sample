"use client";

import { useMemo } from "react";

function renderSimpleMarkdown(input: string) {
  let html = input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br />");
  return html;
}

export default function RichTextEditor({
  label,
  value,
  onChange,
  minRows = 5,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  minRows?: number;
}) {
  const preview = useMemo(() => renderSimpleMarkdown(value), [value]);

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-200">{label}</label>
      <div className="mb-2 flex gap-2">
        <button type="button" className="rounded border border-white/20 px-2 py-1 text-xs text-slate-200" onClick={() => onChange(`${value}**bold**`)}>Bold</button>
        <button type="button" className="rounded border border-white/20 px-2 py-1 text-xs text-slate-200" onClick={() => onChange(`${value}*italic*`)}>Italic</button>
        <button type="button" className="rounded border border-white/20 px-2 py-1 text-xs text-slate-200" onClick={() => onChange(`${value}\n- item`)}>List</button>
      </div>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} className="ui-input min-h-32" rows={minRows} />
      <div className="mt-2 rounded-lg border border-white/10 bg-slate-950/40 p-3 text-sm text-slate-200">
        <p className="mb-1 text-xs uppercase tracking-wide text-slate-400">Preview</p>
        <div dangerouslySetInnerHTML={{ __html: preview }} />
      </div>
    </div>
  );
}
