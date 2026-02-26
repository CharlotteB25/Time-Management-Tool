import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DateTime } from "luxon";
import AdminWeekClient from "./AdminWeekClient";

const TZ = "Europe/Brussels";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Segment = {
  id: string;
  dayIndex: number;
  startMin: number;
  endMin: number;
  categoryId: string;
  categoryName: string;
  description: string | null;
};

function clampDate(d: Date, min: Date, max: Date) {
  return new Date(
    Math.min(max.getTime(), Math.max(min.getTime(), d.getTime())),
  );
}

function mondayOf(date: DateTime) {
  const daysBack = date.weekday - 1; // 1=Mon ... 7=Sun
  return date.minus({ days: daysBack }).startOf("day");
}

export default async function AdminWeekPage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string; week?: string }>;
}) {
  const sp = await searchParams; // ✅ unwrap async searchParams

  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/admin/week");

  // ...then use sp.userId / sp.week everywhere instead of searchParams.userId etc.

  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" },
  });

  const defaultUser = users[0];
  if (!defaultUser) {
    return (
      <main className="min-h-screen p-6">
        <div className="mx-auto max-w-5xl rounded-2xl border bg-white p-6">
          No active users found.
        </div>
      </main>
    );
  }

  // Resolve user (NO redirect)
  const requestedUserId = sp.userId;
  const resolvedUser =
    users.find((u) => u.id === requestedUserId) ?? defaultUser;

  // Resolve week (NO redirect)
  const now = DateTime.now().setZone(TZ);
  const requestedWeek = sp.week;

  const weekStart = (() => {
    if (requestedWeek) {
      const parsed = DateTime.fromISO(requestedWeek, { zone: TZ });
      if (parsed.isValid) return mondayOf(parsed);
    }
    return mondayOf(now);
  })();

  const weekEnd = weekStart.plus({ days: 7 });

  const raw = await prisma.timeSession.findMany({
    where: {
      userId: resolvedUser.id,
      startedAt: { lt: weekEnd.toJSDate() },
      OR: [{ endedAt: { gte: weekStart.toJSDate() } }, { endedAt: null }],
    },
    orderBy: { startedAt: "asc" },
    select: {
      id: true,
      startedAt: true,
      endedAt: true,
      description: true,
      categoryId: true,
      category: { select: { name: true } },
    },
  });

  const nowJs = now.toJSDate();
  const weekStartJs = weekStart.toJSDate();
  const weekEndJs = weekEnd.toJSDate();

  const segments: Segment[] = [];

  for (const s of raw) {
    const started = s.startedAt;
    const ended = s.endedAt ?? nowJs;

    const start = clampDate(started, weekStartJs, weekEndJs);
    const end = clampDate(ended, weekStartJs, weekEndJs);
    if (end.getTime() <= start.getTime()) continue;

    let cur = DateTime.fromJSDate(start, { zone: TZ });
    const endDT = DateTime.fromJSDate(end, { zone: TZ });

    while (cur < endDT) {
      const dayStart = cur.startOf("day");
      const dayEnd = dayStart.plus({ days: 1 });

      const segStart = cur;
      const segEnd = endDT < dayEnd ? endDT : dayEnd;

      const dayIndex = segStart.weekday - 1;

      segments.push({
        id: `${s.id}-${dayIndex}-${segStart.toMillis()}`,
        dayIndex,
        startMin: segStart.hour * 60 + segStart.minute,
        endMin: segEnd.hour * 60 + segEnd.minute,
        categoryId: s.categoryId,
        categoryName: s.category.name,
        description: s.description,
      });

      cur = dayEnd;
    }
  }

  return (
    <AdminWeekClient
      key={`${resolvedUser.id}-${weekStart.toISODate()!}`}
      users={users}
      selectedUserId={resolvedUser.id}
      selectedUserName={resolvedUser.name}
      weekISO={weekStart.toISODate()!}
      segments={segments}
    />
  );
}
