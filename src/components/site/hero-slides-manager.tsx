"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save, Loader2, ArrowUp, ArrowDown, Eye, EyeOff, Upload, Image as ImageIcon, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Slide = {
  id: string; sortOrder: number; mediaType: string; desktopMedia: string;
  mobileMedia?: string | null; posterImage?: string | null;
  headline?: string | null; subtitle?: string | null;
  ctaText?: string | null; ctaUrl?: string | null;
  isActive: boolean; startsAt: string | null; endsAt: string | null;
};

export function HeroSlidesManager({ initialSlides }: { initialSlides: Slide[] }) {
  const router = useRouter();
  const [slides, setSlides] = useState(initialSlides);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Slide | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    mediaType: "image" as "image" | "video", desktopMedia: "", mobileMedia: "",
    posterImage: "", headline: "", subtitle: "", ctaText: "", ctaUrl: "/shop",
    isActive: true, startsAt: "", endsAt: "",
  });

  function resetForm() {
    setForm({ mediaType: "image", desktopMedia: "", mobileMedia: "", posterImage: "", headline: "", subtitle: "", ctaText: "", ctaUrl: "/shop", isActive: true, startsAt: "", endsAt: "" });
    setEditing(null); setShowForm(false);
  }

  async function uploadFile(file: File, field: "desktopMedia" | "mobileMedia" | "posterImage") {
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    setUploading(false);
    if (res.ok) {
      const data = await res.json();
      setForm((f) => ({ ...f, [field]: data.url, mediaType: data.type?.startsWith("video") ? "video" : f.mediaType }));
      toast.success("File uploaded.");
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data?.error?.message || "Upload failed.");
    }
  }

  async function save() {
    if (!form.desktopMedia) { toast.error("Desktop media is required (upload or URL)."); return; }
    setBusy(true);
    const payload = {
      ...form, mobileMedia: form.mobileMedia || undefined, posterImage: form.posterImage || undefined,
      headline: form.headline || undefined, subtitle: form.subtitle || undefined,
      ctaText: form.ctaText || undefined, ctaUrl: form.ctaUrl || undefined,
      startsAt: form.startsAt || undefined, endsAt: form.endsAt || undefined,
      sortOrder: editing ? editing.sortOrder : slides.length,
    };
    const res = editing
      ? await fetch(`/api/admin/hero-slides/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      : await fetch("/api/admin/hero-slides", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setBusy(false);
    if (res.ok) { toast.success(editing ? "Slide updated." : "Slide created."); resetForm(); router.refresh(); }
    else toast.error("Save failed.");
  }

  async function remove(id: string) {
    const res = await fetch(`/api/admin/hero-slides/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Slide deleted."); router.refresh(); }
    else toast.error("Delete failed.");
  }

  async function toggleActive(s: Slide) {
    await fetch(`/api/admin/hero-slides/${s.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !s.isActive }) });
    router.refresh();
  }

  async function reorder(s: Slide, dir: "up" | "down") {
    const newOrder = dir === "up" ? s.sortOrder - 1 : s.sortOrder + 1;
    await fetch(`/api/admin/hero-slides/${s.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sortOrder: newOrder }) });
    router.refresh();
  }

  function edit(s: Slide) {
    setEditing(s);
    setForm({
      mediaType: s.mediaType as "image" | "video", desktopMedia: s.desktopMedia,
      mobileMedia: s.mobileMedia ?? "", posterImage: s.posterImage ?? "",
      headline: s.headline ?? "", subtitle: s.subtitle ?? "",
      ctaText: s.ctaText ?? "", ctaUrl: s.ctaUrl ?? "/shop",
      isActive: s.isActive, startsAt: s.startsAt ?? "", endsAt: s.endsAt ?? "",
    });
    setShowForm(true);
  }

  function renderUploadField(field: "desktopMedia" | "mobileMedia" | "posterImage", label: string) {
    return (
      <div key={field}>
        <Label>{label}</Label>
        <div className="mt-1 flex gap-2">
          <Input value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} placeholder="URL or upload" className="flex-1" />
          <Button type="button" variant="outline" disabled={uploading} onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = form.mediaType === "video" && field === "desktopMedia" ? "video/mp4,video/webm" : "image/jpeg,image/png,image/webp";
            input.onchange = () => { if (input.files?.[0]) uploadFile(input.files[0], field); };
            input.click();
          }} className="shrink-0 gap-1.5">
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Upload
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {!showForm && (
        <Button onClick={() => setShowForm(true)} className="gap-2 bg-forest hover:bg-forest-light">
          <Plus size={15} /> Add Slide
        </Button>
      )}

      {showForm && (
        <div className="mt-4 rounded-xl border border-border bg-white p-5">
          <h2 className="font-sans text-base font-bold text-forest">{editing ? "Edit Slide" : "New Slide"}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Media Type</Label>
              <select value={form.mediaType} onChange={(e) => setForm({ ...form, mediaType: e.target.value as "image" | "video" })} className="mt-1 h-10 w-full rounded-lg border border-border bg-white px-3 text-sm">
                <option value="image">Image (JPG/PNG/WebP)</option>
                <option value="video">Video (MP4/WebM)</option>
              </select>
            </div>
            <div className="col-span-2">{renderUploadField("desktopMedia", "Desktop Media (upload or URL) *")}</div>
            <div>{renderUploadField("mobileMedia", "Mobile Media (optional)")}</div>
            <div>{renderUploadField("posterImage", "Poster Image (video)")}</div>
            <div className="col-span-2"><Label>Headline</Label><Input value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} className="mt-1" placeholder="Real Beauty Starts With Healthy Skin" /></div>
            <div className="col-span-2"><Label>Subtitle</Label><Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className="mt-1" /></div>
            <div><Label>CTA Text</Label><Input value={form.ctaText} onChange={(e) => setForm({ ...form, ctaText: e.target.value })} className="mt-1" placeholder="Shop Now" /></div>
            <div><Label>CTA URL</Label><Input value={form.ctaUrl} onChange={(e) => setForm({ ...form, ctaUrl: e.target.value })} className="mt-1" placeholder="/shop" /></div>
            <div><Label>Start (optional)</Label><Input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} className="mt-1" /></div>
            <div><Label>End (optional)</Label><Input type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} className="mt-1" /></div>
            <label className="flex items-center gap-2 text-sm text-forest"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4 accent-forest" /> Active</label>
          </div>
          {form.desktopMedia && (
            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Preview</p>
              <div className="mt-2 relative aspect-video overflow-hidden rounded-lg bg-forest">
                {form.mediaType === "video" ? (
                  <video src={form.desktopMedia} poster={form.posterImage || undefined} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <img src={form.desktopMedia} alt="Preview" className="absolute inset-0 h-full w-full object-cover" />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-forest/80 to-transparent" />
                {form.headline && <p className="absolute bottom-4 left-4 font-serif text-lg font-bold text-white">{form.headline}</p>}
                {form.ctaText && <span className="absolute bottom-4 right-4 rounded-full bg-blush px-3 py-1 text-xs font-semibold text-forest">{form.ctaText}</span>}
              </div>
            </div>
          )}
          <div className="mt-4 flex gap-2">
            <Button onClick={save} disabled={busy || uploading} className="gap-2 bg-forest hover:bg-forest-light">{busy ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} {editing ? "Update" : "Create"}</Button>
            <Button variant="ghost" onClick={resetForm}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="mt-5 space-y-3">
        {slides.length === 0 && !showForm && (
          <p className="rounded-xl border border-dashed border-border bg-white/50 px-6 py-12 text-center text-sm text-muted-foreground">No hero slides yet. Click "Add Slide" to create one.</p>
        )}
        {slides.map((s, i) => (
          <div key={s.id} className="flex items-center gap-3 rounded-xl border border-border bg-white p-3">
            <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-blush-tile">
              {s.mediaType === "video" ? <Video size={20} className="mx-auto mt-5 text-forest" /> : s.desktopMedia && <img src={s.desktopMedia} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-forest">{s.headline || "(no headline)"}</p>
              <p className="text-xs text-muted-foreground">{s.mediaType} · order {s.sortOrder} {!s.isActive && "· INACTIVE"}</p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => reorder(s, "up")} disabled={i === 0} className="rounded p-1.5 text-forest hover:bg-forest/5 disabled:opacity-30"><ArrowUp size={15} /></button>
              <button onClick={() => reorder(s, "down")} disabled={i === slides.length - 1} className="rounded p-1.5 text-forest hover:bg-forest/5 disabled:opacity-30"><ArrowDown size={15} /></button>
              <button onClick={() => toggleActive(s)} className="rounded p-1.5 text-forest hover:bg-forest/5">{s.isActive ? <Eye size={15} /> : <EyeOff size={15} />}</button>
              <button onClick={() => edit(s)} className="rounded px-2 py-1 text-xs font-medium text-forest hover:bg-forest/5">Edit</button>
              <button onClick={() => remove(s.id)} className="rounded p-1.5 text-red-600 hover:bg-red-50"><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
