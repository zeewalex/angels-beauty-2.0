"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Plus, Star, Trash2, Loader2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Image = { id: string; url: string; altText: string | null; isPrimary: boolean; sortOrder: number };

export function ProductEditor({
  product,
  categories,
}: {
  product: {
    id: string; name: string; description: string; categoryId: string; status: string;
    isFeatured: boolean; isBestSeller: boolean; isTrending: boolean;
    variants: { id: string; priceCents: number; inventory: { quantity: number } | null }[];
    images: Image[];
  };
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const v = product.variants[0];
  const [details, setDetails] = useState({ name: product.name, description: product.description, categoryId: product.categoryId, isFeatured: product.isFeatured, isBestSeller: product.isBestSeller, isTrending: product.isTrending });
  const [price, setPrice] = useState(v ? (v.priceCents / 100).toFixed(2) : "0");
  const [stock, setStock] = useState(v?.inventory?.quantity ?? 0);
  const [savingDetails, setSavingDetails] = useState(false);
  const [savingVariant, setSavingVariant] = useState(false);
  const [images, setImages] = useState<Image[]>(product.images);
  const [newUrl, setNewUrl] = useState("");
  const [imgBusy, setImgBusy] = useState(false);

  async function saveDetails() {
    setSavingDetails(true);
    const res = await fetch(`/api/admin/products/${product.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(details) });
    setSavingDetails(false);
    if (res.ok) toast.success("Product details saved.");
    else toast.error("Save failed.");
    router.refresh();
  }

  async function saveVariant() {
    setSavingVariant(true);
    const res = await fetch(`/api/admin/products/${product.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ priceCents: Math.round(parseFloat(price) * 100), stock: parseInt(String(stock)) }) });
    setSavingVariant(false);
    if (res.ok) toast.success("Price & stock saved.");
    else toast.error("Save failed.");
    router.refresh();
  }

  async function addImage() {
    if (!newUrl) return;
    setImgBusy(true);
    const res = await fetch(`/api/admin/products/${product.id}/images`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: newUrl }) });
    setImgBusy(false);
    if (res.ok) { toast.success("Image added."); setNewUrl(""); router.refresh(); }
    else toast.error("Add failed.");
  }

  async function setPrimary(id: string) {
    const res = await fetch(`/api/admin/images/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isPrimary: true }) });
    if (res.ok) { toast.success("Primary image set."); router.refresh(); }
  }

  async function deleteImage(id: string) {
    const res = await fetch(`/api/admin/images/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Image removed."); setImages(images.filter((i) => i.id !== id)); router.refresh(); }
    else toast.error("Delete failed.");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Details (no image fields) */}
      <section className="rounded-xl border border-border bg-white p-5">
        <h2 className="font-sans text-base font-bold text-forest">Product Details</h2>
        <div className="mt-4 space-y-3">
          <div><Label>Name</Label><Input value={details.name} onChange={(e) => setDetails({ ...details, name: e.target.value })} className="mt-1" /></div>
          <div><Label>Description</Label><textarea value={details.description} onChange={(e) => setDetails({ ...details, description: e.target.value })} className="mt-1 min-h-[90px] w-full rounded-lg border border-border px-3 py-2 text-sm" /></div>
          <div><Label>Category</Label>
            <select value={details.categoryId} onChange={(e) => setDetails({ ...details, categoryId: e.target.value })} className="mt-1 h-10 w-full rounded-lg border border-border bg-white px-3 text-sm">
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex flex-wrap gap-3">
            {(["isFeatured", "isBestSeller", "isTrending"] as const).map((f) => (
              <label key={f} className="flex items-center gap-1.5 text-sm text-forest">
                <input type="checkbox" checked={details[f]} onChange={(e) => setDetails({ ...details, [f]: e.target.checked })} className="h-4 w-4 accent-forest" />
                {f.replace("is", "Featured ").replace("isBest", "Best ").replace("isTrending", "Trending").replace("Seller", "Seller").trim() || f}
              </label>
            ))}
          </div>
          <Button onClick={saveDetails} disabled={savingDetails} className="gap-2 bg-forest hover:bg-forest-light">
            {savingDetails ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save Details
          </Button>
        </div>
      </section>

      <div className="space-y-6">
        {/* Variant: price + stock */}
        <section className="rounded-xl border border-border bg-white p-5">
          <h2 className="font-sans text-base font-bold text-forest">Pricing & Stock</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div><Label>Price ($)</Label><Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="mt-1" /></div>
            <div><Label>Stock</Label><Input type="number" value={stock} onChange={(e) => setStock(e.target.value)} className="mt-1" /></div>
          </div>
          <Button onClick={saveVariant} disabled={savingVariant} className="mt-4 gap-2 bg-forest hover:bg-forest-light">
            {savingVariant ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save Price & Stock
          </Button>
        </section>

        {/* Dedicated image management — separate from the product/variant edits above */}
        <section className="rounded-xl border border-border bg-white p-5">
          <div className="flex items-center gap-2">
            <ImageIcon size={16} className="text-forest-light" />
            <h2 className="font-sans text-base font-bold text-forest">Images</h2>
            <span className="text-[11px] text-muted-foreground">(managed separately — product edits never touch these)</span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {images.map((im) => (
              <div key={im.id} className="relative aspect-square overflow-hidden rounded-lg border border-border bg-blush-tile">
                <img src={im.url} alt={im.altText ?? ""} className="h-full w-full object-cover" />
                {im.isPrimary && <span className="absolute left-1 top-1 rounded bg-forest px-1.5 py-0.5 text-[9px] font-bold text-white">Primary</span>}
                <div className="absolute inset-x-0 bottom-0 flex justify-between bg-forest/80 px-1 py-0.5">
                  <button onClick={() => setPrimary(im.id)} disabled={im.isPrimary} className="text-[10px] text-white disabled:opacity-40"><Star size={12} className={cn(im.isPrimary && "fill-white")} /></button>
                  <button onClick={() => deleteImage(im.id)} className="text-[10px] text-white hover:text-blush"><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <Input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="Image URL (Cloudinary in Phase 3)" className="flex-1" />
            <Button onClick={addImage} disabled={imgBusy || !newUrl} className="gap-2 bg-forest hover:bg-forest-light">
              {imgBusy ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Add
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
