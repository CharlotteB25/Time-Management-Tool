import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Leie Autos Time Tool",
  description: "Internal time tracking tool",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl">
      <body className=" bg-neutral-50 text-neutral-900">{children}</body>
    </html>
  );
}
