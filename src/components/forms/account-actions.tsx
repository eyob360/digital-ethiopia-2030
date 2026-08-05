"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function AccountActions() {
  return (
    <Button onClick={() => void signOut({ callbackUrl: "/login" })} variant="secondary">
      Sign out
    </Button>
  );
}
