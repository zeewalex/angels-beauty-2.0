"use client";

import { useState, useEffect, useCallback } from "react";
import { Truck, Sparkles, RefreshCcw, Tag, Plus, Trash2, Save, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Message {
  icon: string;
  text: string;
}

const ICON_OPTIONS = [
  { value: "truck", label: "Shipping", Icon: Truck },
  { value: "sparkles", label: "Collection", Icon: Sparkles },
  { value: "refresh", label: "Returns", Icon: RefreshCcw },
  { value: "tag", label: "Promo", Icon: Tag },
];

export default function AnnouncementsPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/announcements");
      const data = await res.json();
      setMessages(data.messages || []);
      setUpdatedAt(data.updatedAt || null);
    } catch {
      toast.error("Could not load announcements.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function updateMessage(index: number, field: keyof Message, value: string) {
    setMessages((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function addMessage() {
    if (messages.length >= 5) {
      toast.error("Maximum 5 announcement messages.");
      return;
    }
    setMessages([...messages, { icon: "tag", text: "" }]);
  }

  function removeMessage(index: number) {
    setMessages(messages.filter((_, i) => i !== index));
  }

  async function save() {
    const valid = messages.filter((m) => m.text.trim().length > 0);
    if (valid.length === 0) {
      toast.error("At least one message with text is required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: valid }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Could not save.");
        return;
      }
      toast.success("Announcements updated.");
      setUpdatedAt(data.updatedAt);
    } catch {
      toast.error("Could not save announcements.");
    } finally {
      setSaving(false);
    }
  }

  function resetToDefaults() {
    setMessages([
      { icon: "truck", text: "Free Shipping on Orders Over $50" },
      { icon: "sparkles", text: "New Season Collection Now Live" },
      { icon: "refresh", text: "Easy Returns & Exchanges" },
    ]);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-forest">Announcement Bar</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Edit the messages shown in the rotating announcement bar at the top of every storefront page.
          Messages rotate every 3.5 seconds with a smooth fade transition.
        </p>
      </div>

      {updatedAt && (
        <p className="text-xs text-muted-foreground">
          Last updated: {new Date(updatedAt).toLocaleString()}
        </p>
      )}

      {loading ? (
        <div className="rounded-xl border border-border bg-white p-8 text-center text-sm text-muted-foreground">
          Loading…
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg, i) => {
            const CurrentIcon = ICON_OPTIONS.find((o) => o.value === msg.icon)?.Icon || Tag;
            return (
              <div key={i} className="flex items-start gap-3 rounded-xl border border-border bg-white p-4">
                {/* Icon picker */}
                <div className="flex flex-wrap gap-1">
                  {ICON_OPTIONS.map(({ value, Icon, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => updateMessage(i, "icon", value)}
                      title={label}
                      className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                        msg.icon === value
                          ? "bg-forest text-white"
                          : "bg-muted text-muted-foreground hover:bg-forest/10"
                      }`}
                    >
                      <Icon size={16} />
                    </button>
                  ))}
                </div>

                {/* Text input */}
                <div className="flex-1">
                  <Input
                    value={msg.text}
                    onChange={(e) => updateMessage(i, "text", e.target.value)}
                    placeholder="Announcement message…"
                    maxLength={100}
                  />
                </div>

                {/* Preview */}
                <div className="hidden items-center gap-1.5 rounded-lg bg-forest-dark px-3 py-2 text-cream sm:flex">
                  <CurrentIcon size={13} className="text-blush" />
                  <span className="text-[11px] font-medium">{msg.text || "Preview"}</span>
                </div>

                {/* Delete */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeMessage(i)}
                  className="text-red-600 hover:bg-red-50"
                  disabled={messages.length <= 1}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            );
          })}

          <div className="flex items-center justify-between gap-3">
            <Button variant="outline" size="sm" onClick={addMessage} disabled={messages.length >= 5}>
              <Plus size={15} /> Add message
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={resetToDefaults}>
                <RotateCcw size={15} /> Reset to defaults
              </Button>
              <Button onClick={save} disabled={saving} className="gap-2 bg-forest hover:bg-forest-light">
                {saving ? "Saving…" : <><Save size={15} /> Save</>}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
        <p className="font-medium text-foreground/80">Tips</p>
        <ul className="mt-1 space-y-0.5">
          <li>• Maximum 5 messages. Keep text under 100 characters.</li>
          <li>• Messages rotate automatically every 3.5 seconds.</li>
          <li>• Users with reduced-motion preference see the first message only.</li>
          <li>• Changes appear immediately on all storefront pages after saving.</li>
        </ul>
      </div>
    </div>
  );
}
