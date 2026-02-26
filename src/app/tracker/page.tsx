import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TrackerClient from "./TrackerClient";
import { redirect } from "next/navigation";
import { TimerRunningBanner } from "@/src/components/TimerRunningBanner";

export default async function TrackerPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const role = session?.user?.role;
  const userName = session?.user?.name ?? "User";

  if (!userId || !role) redirect("/login");

  const categories = await prisma.taskCategory.findMany({
    where: { role, isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true },
  });

  const open = await prisma.timeSession.findFirst({
    where: { userId, endedAt: null },
    orderBy: { startedAt: "desc" },
    select: {
      id: true,
      categoryId: true,
      startedAt: true,
      description: true,
      category: { select: { name: true } },
    },
  });

  const openSession = open
    ? {
        id: open.id,
        categoryId: open.categoryId, // ✅ add
        startedAt: open.startedAt.toISOString(),
        description: open.description,
        categoryName: open.category.name,
      }
    : null;
  return (
    <>
      <TimerRunningBanner />
      <TrackerClient
        categories={categories}
        openSession={openSession}
        userName={userName}
      />
    </>
  );
}

//server page to fetch data and pass to client component. Also handles auth and redirects to then pass onto the front end component. The client component is purely for UI and interactions, no data fetching or auth logic in there. the TrackerClient component is the main UI component that renders the tracker interface, it receives the categories, open session and user name as props from this server page. The TimerRunningBanner is a separate component that checks if there's a running timer and displays a banner if so, it's included in both the tracker and history pages for better UX.
