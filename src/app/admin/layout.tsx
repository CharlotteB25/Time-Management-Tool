// src/app/admin/layout.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const role = session?.user?.role;

  if (!session?.user) redirect("/login");
  if (role !== "ADMIN") redirect("/tracker");

  return <>{children}</>;
}
