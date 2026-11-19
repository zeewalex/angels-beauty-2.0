"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, Upload, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function BlogEditor({ post }: { post?: any }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: post?.title || "",
    slug: post?.slug || "",
    excerpt: post?.excerpt || "",
    body: post?.body || "",
    featuredImage: post?.featuredImage || "",
    category: post?.category || "General",
    status: post?.status || "DRAFT",
    publishedAt: post?.publishedAt ? new Date(post.publishedAt).toISOString().slice(0, 16) : "",
    seoTitle: post?.seoTitle || "",
    seoDescription: post?.seoDescription || "",
  });
  const [showPreview, setShowPreview] = useState(false);

  async function uploadImage(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    setUploading(false);
    if (res.ok) {
      const data = await res.json();
      setForm((f) => ({ ...f, featuredImage: data.url }));
      toast.success("Image uploaded.");
    } else toast.error("Upload failed.");
  }

  async function save(status?: string) {
    if (!form.title) { toast.error("Title is required."); return; }
    setBusy(true);
    const finalSlug = form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const payload = { ...form, slug: finalSlug, status: status || form.status, publishedAt: form.publishedAt || (status === "PUBLISHED" ? new Date().toISOString() : null) };
    const res = post
      ? await fetch(`/api/admin/blog/${post.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      : await fetch("/api/admin/blog", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setBusy(false);
    if (res.ok) {
      toast.success("Post saved.");
      router.push("/admin/blog");
      router.refresh();
    } else toast.error("Save failed.");
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-sans text-2xl font-bold text-forest">{post ? "Edit Post" : "New Blog Post"}</h1>
        <Button variant="ghost" onClick={() => setShowPreview(!showPreview)} className="gap-1.5"><Eye size={15} /> {showPreview ? "Edit" : "Preview"}</Button>
      </div>

      {showPreview ? (
        <div className="mt-5 rounded-xl border border-border bg-white p-6">
          {form.featuredImage && <img src={form.featuredImage} alt="" className="mb-4 aspect-video w-full rounded-lg object-cover" />}
          <p className="text-xs font-medium uppercase tracking-wide text-blush-dark">{form.category}</p>
          <h2 className="mt-1 font-serif text-2xl font-bold text-forest">{form.title}</h2>
          <div className="prose prose-sm mt-4 max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: form.body }} />
        </div>
      ) : (
        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_280px]">
          <div className="space-y-4 rounded-xl border border-border bg-white p-5">
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1" /></div>
            <div><Label>Slug (optional — auto-generated if blank)</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="mt-1" placeholder="my-blog-post" /></div>
            <div><Label>Excerpt</Label><Input value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} className="mt-1" /></div>
            <div>
              <Label>Body (HTML)</Label>
              <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} className="mt-1 min-h-[300px] w-full rounded-lg border border-border px-3 py-2 text-sm font-mono" placeholder="<p>Your article content...</p>" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-white p-5">
              <h3 className="font-sans text-sm font-bold text-forest">Publishing</h3>
              <div className="mt-3 space-y-3">
                <div><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-1" /></div>
                <div><Label>Status</Label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="mt-1 h-10 w-full rounded-lg border border-border bg-white px-3 text-sm">
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="SCHEDULED">Scheduled</option>
                  </select>
                </div>
                <div><Label>Publish Date</Label><Input type="datetime-local" value={form.publishedAt} onChange={(e) => setForm({ ...form, publishedAt: e.target.value })} className="mt-1" /></div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-white p-5">
              <h3 className="font-sans text-sm font-bold text-forest">Featured Image</h3>
              <div className="mt-3">
                {form.featuredImage && <img src={form.featuredImage} alt="" className="mb-2 aspect-video w-full rounded-lg object-cover" />}
                <div className="flex gap-2">
                  <Input value={form.featuredImage} onChange={(e) => setForm({ ...form, featuredImage: e.target.value })} placeholder="URL" className="flex-1" />
                  <Button type="button" variant="outline" disabled={uploading} onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file"; input.accept = "image/jpeg,image/png,image/webp";
                    input.onchange = () => { if (input.files?.[0]) uploadImage(input.files[0]); };
                    input.click();
                  }} className="shrink-0 gap-1.5">{uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}</Button>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-white p-5">
              <h3 className="font-sans text-sm font-bold text-forest">SEO</h3>
              <div className="mt-3 space-y-3">
                <div><Label>SEO Title</Label><Input value={form.seoTitle} onChange={(e) => setForm({ ...form, seoTitle: e.target.value })} className="mt-1" /></div>
                <div><Label>SEO Description</Label><textarea value={form.seoDescription} onChange={(e) => setForm({ ...form, seoDescription: e.target.value })} className="mt-1 min-h-[60px] w-full rounded-lg border border-border px-3 py-2 text-sm" /></div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button onClick={() => save()} disabled={busy} className="gap-2 bg-forest hover:bg-forest-light">{busy ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save Draft</Button>
              <Button onClick={() => save("PUBLISHED")} disabled={busy} variant="outline" className="border-forest/30 text-forest">Publish</Button>
              <Button onClick={() => save("DRAFT")} disabled={busy} variant="ghost">Unpublish</Button>
              {post && <Button onClick={async () => { if (confirm("Delete this post?")) { await fetch(`/api/admin/blog/${post.id}`, { method: "DELETE" }); toast.success("Deleted."); router.push("/admin/blog"); router.refresh(); } }} variant="ghost" className="text-red-600">Delete Post</Button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
