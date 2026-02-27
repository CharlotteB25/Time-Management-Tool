"use client";

import NextTopLoader from "nextjs-toploader";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NextTopLoader showSpinner={false} />
      {children}
    </>
  );
}
