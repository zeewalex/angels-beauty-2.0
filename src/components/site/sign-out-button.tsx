"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <Button
      variant="outline"
      className="gap-2 border-forest/30 text-forest hover:bg-forest/5"
      onClick={() => signOut({ callbackUrl: "/" })}
    >
      <LogOut size={15} />
      Sign Out
    </Button>
  );
}
