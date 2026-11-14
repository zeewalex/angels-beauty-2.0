import { Truck, Sparkles, RefreshCcw } from "lucide-react";

const items = [
  { icon: Truck, text: "Free Shipping on Orders Over $50" },
  { icon: Sparkles, text: "New Season Collection Now Live" },
  { icon: RefreshCcw, text: "Easy Returns & Exchanges" },
];

function MobileHeadline() {
  const Icon = items[0].icon;
  return (
    <span className="flex items-center gap-1.5 text-[11px] font-medium">
      <Icon size={13} className="text-blush" />
      {items[0].text}
    </span>
  );
}

export function AnnouncementBar() {
  return (
    <div className="bg-forest-dark text-cream">
      <div className="mx-auto hidden max-w-7xl items-center justify-between px-6 py-2 text-[11px] font-medium tracking-wide sm:flex">
        {items.map((it, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <it.icon size={13} className="text-blush" />
            {it.text}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-center py-2 sm:hidden">
        <MobileHeadline />
      </div>
    </div>
  );
}
