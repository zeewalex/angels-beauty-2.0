"use client";

import { useState, useEffect, useCallback } from "react";
import { ShieldCheck, Trash2, Monitor, Clock, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Device {
  id: string;
  userEmail: string;
  userName: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
  lastUsedAt: string | null;
  status: "active" | "revoked" | "expired";
}

function formatBrowser(ua: string | null): string {
  if (!ua) return "Unknown browser";
  if (ua.includes("Edg/")) return "Microsoft Edge";
  if (ua.includes("Chrome/")) return "Chrome";
  if (ua.includes("Firefox/")) return "Firefox";
  if (ua.includes("Safari/")) return "Safari";
  return "Browser";
}

function formatOS(ua: string | null): string {
  if (!ua) return "";
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac OS")) return "macOS";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
  if (ua.includes("Linux")) return "Linux";
  return "";
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/devices");
      const data = await res.json();
      setDevices(data.devices || []);
    } catch {
      toast.error("Could not load trusted devices.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function revoke(id: string) {
    setRevoking(id);
    try {
      const res = await fetch(`/api/admin/devices/${id}/revoke`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Could not revoke device.");
        return;
      }
      toast.success("Device revoked. It will be denied on the next request.");
      load();
    } catch {
      toast.error("Could not revoke device.");
    } finally {
      setRevoking(null);
    }
  }

  const activeCount = devices.filter((d) => d.status === "active").length;
  const revokedCount = devices.filter((d) => d.status === "revoked").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-forest flex items-center gap-2">
            <ShieldCheck size={24} /> Trusted Devices
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage devices that have been trusted for five-tap admin access.
            Revoking a device immediately denies further access.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-xs font-medium text-muted-foreground">Total Devices</p>
          <p className="mt-1 text-2xl font-bold text-forest">{devices.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-xs font-medium text-muted-foreground">Active</p>
          <p className="mt-1 text-2xl font-bold text-forest">{activeCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-xs font-medium text-muted-foreground">Revoked</p>
          <p className="mt-1 text-2xl font-bold text-forest">{revokedCount}</p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-border bg-white p-12 text-center text-sm text-muted-foreground">
          Loading trusted devices…
        </div>
      ) : devices.length === 0 ? (
        <div className="rounded-xl border border-border bg-white p-12 text-center">
          <Monitor size={32} className="mx-auto text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            No trusted devices enrolled yet. Use the five-tap logo shortcut on
            a device to enroll it.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-white overflow-hidden">
          <div className="max-h-[600px] overflow-y-auto scrollbar-blush">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/30 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Device</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Admin</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Enrolled</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Last Used</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Expires</th>
                  <th className="px-4 py-3 text-right font-semibold text-foreground">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {devices.map((d) => (
                  <tr key={d.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Monitor size={16} className="text-muted-foreground" />
                        <div>
                          <p className="font-medium text-foreground">
                            {formatBrowser(d.userAgent)}
                            {d.userAgent && (
                              <span className="text-muted-foreground"> · {formatOS(d.userAgent)}</span>
                            )}
                          </p>
                          {d.ipAddress && (
                            <p className="text-xs text-muted-foreground">IP: {d.ipAddress}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{d.userName}</p>
                      <p className="text-xs text-muted-foreground">{d.userEmail}</p>
                    </td>
                    <td className="px-4 py-3">
                      {d.status === "active" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                          <CheckCircle2 size={12} /> Active
                        </span>
                      ) : d.status === "revoked" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                          <XCircle size={12} /> Revoked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          <Clock size={12} /> Expired
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatDate(d.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatDate(d.lastUsedAt)}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatDate(d.expiresAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {d.status === "active" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => revoke(d.id)}
                          disabled={revoking === d.id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 size={14} /> Revoke
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
