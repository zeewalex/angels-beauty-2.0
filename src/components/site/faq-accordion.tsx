"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function FAQAccordion({ faqs }: { faqs: { id: string; question: string; answer: string }[] }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="mt-3 divide-y divide-border rounded-xl border border-border bg-white">
      {faqs.map((f) => (
        <div key={f.id}>
          <button
            onClick={() => setOpen(open === f.id ? null : f.id)}
            className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-forest hover:bg-cream/40"
            aria-expanded={open === f.id}
          >
            {f.question}
            <ChevronDown size={16} className={cn("shrink-0 transition-transform", open === f.id && "rotate-180")} />
          </button>
          {open === f.id && (
            <div className="px-4 pb-3 text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: f.answer }} />
          )}
        </div>
      ))}
    </div>
  );
}
