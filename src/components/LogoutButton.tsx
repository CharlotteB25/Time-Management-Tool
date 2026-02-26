"use client";

import * as React from "react";
import { signOut } from "next-auth/react";

export function LogoutButton({ className = "" }: { className?: string }) {
  const [pending, startTransition] = React.useTransition();

  return (
    <button
      type="button"
      onClick={() =>
        startTransition(() => {
          signOut({ callbackUrl: "/login" });
        })
      }
      disabled={pending}
      className={[
        "rounded-xl border bg-white px-3 py-2 text-sm hover:bg-neutral-50 disabled:opacity-60",
        className,
      ].join(" ")}
    >
      {pending ? "Logging out…" : "Log out"}
    </button>
  );
}
