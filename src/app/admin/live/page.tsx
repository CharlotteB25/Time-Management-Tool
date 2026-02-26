import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AdminLiveClient from "./AdminLiveClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminLivePage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/tracker");

  const open = await prisma.timeSession.findMany({
    where: { endedAt: null },
    orderBy: [{ startedAt: "asc" }],
    select: {
      id: true,
      startedAt: true,
      description: true,
      user: { select: { id: true, name: true, role: true } },
      category: { select: { id: true, name: true } },
    },
  });

  const activeSessions = open.map((s) => ({
    id: s.id,
    startedAt: s.startedAt.toISOString(),
    description: s.description,
    user: s.user,
    category: s.category,
  }));

  const totalActive = activeSessions.length;

  return (
    <AdminLiveClient
      activeSessions={activeSessions}
      totalActive={totalActive}
    />
  );
}
