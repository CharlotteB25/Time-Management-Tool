"use client";

import { signOut } from "next-auth/react";
import * as React from "react";

export default function LogoutPage() {
  React.useEffect(() => {
    signOut({ callbackUrl: "/login" });
  }, []);
  return null;
}
