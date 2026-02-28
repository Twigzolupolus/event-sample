"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { z } from "zod";
import RichTextEditor from "@/components/RichTextEditor";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().min(1, "Description is required"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  location: z.string().min(1, "Location is required"),
  category: z.string().min(1, "Category is required"),
  organizer: z.string().min(1, "Organizer is required"),
  notes: z.string().min(1, "Notes are required"),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  seoTitle: z.string().optional().or(z.literal("")),
  seoDescription: z.string().optional().or(z.literal("")),
  scheduledPublishAt: z.string().optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED"]),
});

type EventInput = z.infer<typeof schema>;

const slugify = (v: string) => v.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");

export default function EventForm({ initial, id }: { initial?: Partial<EventInput>; id?: string }) {
  const router = useRouter();
  const [manualSlug, setManualSlug] = useState(!!initial?.slug);
  const [error, setError] = useState<string | null>(null);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [imageValid, setImageValid] = useState<boolean | null>(null);
  const [form, setForm] = useState<EventInput>({
    title: initial?.title ?? "",
    slug: initial?.slug ?? "",
    description: initial?.description ?? "",
    date: initial?.date ?? "",
    time: initial?.time ?? "",
    location: initial?.location ?? "",
    category: initial?.category ?? "",
    organizer: initial?.organizer ?? "",
    notes: initial?.notes ?? "",
    imageUrl: initial?.imageUrl ?? "",
    seoTitle: initial?.seoTitle ?? "",
    seoDescription: initial?.seoDescription ?? "",
    scheduledPublishAt: initial?.scheduledPublishAt ?? "",
    status: initial?.status ?? "DRAFT",
  });

  const effectiveSlug = useMemo(() => (manualSlug ? form.slug : slugify(form.title)), [form.title, form.slug, manualSlug]);

  useEffect(() => {
    if (!effectiveSlug) return;
    const t = setTimeout(async () => {
      const res = await fetch(`/api/events/slug-check?slug=${encodeURIComponent(effectiveSlug)}${id ? `&id=${id}` : ""}`);
      const data = await res.json();
      setSlugAvailable(Boolean(data.available));
    }, 250);
    return () => clearTimeout(t);
  }, [effectiveSlug, id]);

  useEffect(() => {
    if (!form.imageUrl) {
      setImageValid(null);
      return;
    }
    const img = new Image();
    img.onload = () => setImageValid(true);
    img.onerror = () => setImageValid(false);
    img.src = form.imageUrl;
  }, [form.imageUrl]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const payload = { ...form, slug: effectiveSlug };
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "Validation failed");
      return;
    }
    if (slugAvailable === false) {
      setError("Slug is already taken");
      return;
    }

    setError(null);

    const res = await fetch(id ? `/api/events/${id}` : "/api/events", {
      method: id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      setError("Save failed");
      return;
    }
    const data = await res.json();
    if (!id && data?.eventCode) {
      router.push(`/admin/new/success?code=${encodeURIComponent(data.eventCode)}&id=${encodeURIComponent(data.id)}`);
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  async function remove() {
    if (!id) return;
    const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    router.push("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="glass space-y-4 rounded-2xl p-5">
      {error ? <p className="rounded bg-red-950/40 p-2 text-sm text-red-200">{error}</p> : null}

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-200">Title</label>
        <input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="ui-input" />
      </div>

      <RichTextEditor label="Description" value={form.description} onChange={(v) => setForm((f) => ({ ...f, description: v }))} />

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-200">Date (YYYY-MM-DD)</label>
          <input required value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="ui-input" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-200">Time</label>
          <input required value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} className="ui-input" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-200">Location</label>
          <input required value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} className="ui-input" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-200">Category</label>
          <input required value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="ui-input" />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-200">Organizer</label>
        <input required value={form.organizer} onChange={(e) => setForm((f) => ({ ...f, organizer: e.target.value }))} className="ui-input" />
      </div>

      <RichTextEditor label="Notes" value={form.notes} onChange={(v) => setForm((f) => ({ ...f, notes: v }))} />

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-200">Slug</label>
        <div className="flex gap-2">
          <input value={effectiveSlug} onChange={(e) => { setManualSlug(true); setForm((f) => ({ ...f, slug: slugify(e.target.value) })); }} className="ui-input" />
          <button type="button" className="rounded border border-white/20 px-3 text-sm text-slate-200" onClick={() => { setManualSlug(false); setForm((f) => ({ ...f, slug: slugify(f.title) })); }}>Auto</button>
        </div>
        {slugAvailable === true ? <p className="mt-1 text-xs text-emerald-300">Slug available</p> : null}
        {slugAvailable === false ? <p className="mt-1 text-xs text-rose-300">Slug already taken</p> : null}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-200">Image URL (optional)</label>
        <input value={form.imageUrl} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))} className="ui-input" />
        {imageValid === true ? <p className="mt-1 text-xs text-emerald-300">Image URL is valid</p> : null}
        {imageValid === false ? <p className="mt-1 text-xs text-rose-300">Image URL failed to load</p> : null}
      </div>

      {form.imageUrl ? <img src={form.imageUrl} alt="preview" className="h-52 w-full rounded-xl object-cover" /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-200">SEO Title (optional)</label>
          <input value={form.seoTitle} onChange={(e) => setForm((f) => ({ ...f, seoTitle: e.target.value }))} className="ui-input" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-200">Scheduled Publish At (optional)</label>
          <input type="datetime-local" value={form.scheduledPublishAt} onChange={(e) => setForm((f) => ({ ...f, scheduledPublishAt: e.target.value }))} className="ui-input" />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-200">SEO Description (optional)</label>
        <textarea value={form.seoDescription} onChange={(e) => setForm((f) => ({ ...f, seoDescription: e.target.value }))} className="ui-input min-h-24" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-200">Status</label>
        <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as "DRAFT" | "PUBLISHED" }))} className="ui-input">
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
        </select>
      </div>

      <div className="flex gap-2">
        <button className="rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 px-4 py-2 text-white">Save</button>
        {id ? <button type="button" onClick={remove} className="rounded-xl border border-red-400/40 bg-red-950/40 px-4 py-2 text-red-200">Delete</button> : null}
      </div>
    </form>
  );
}
