import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DateTime } from "luxon";
import { TimerRunningBanner } from "@/src/components/TimerRunningBanner";
const TZ = "Europe/Brussels";

function formatHMS(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function secondsBetween(a: Date, b: Date) {
  return Math.max(0, Math.floor((b.getTime() - a.getTime()) / 1000));
}

export default async function HistoryPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const userName = session?.user?.name ?? "User";
  if (!userId) redirect("/login");

  const now = DateTime.now().setZone(TZ);
  const startOfToday = now.startOf("day");
  const startOfWeek = now.startOf("week"); // Luxon: Monday start by locale; in BE this is Monday

  const todayStart = startOfToday.toJSDate();
  const weekStart = startOfWeek.toJSDate();
  const nowJs = now.toJSDate();

  // Pull sessions for this week (includes today)
  const sessions = await prisma.timeSession.findMany({
    where: {
      userId,
      startedAt: { gte: weekStart },
    },
    orderBy: { startedAt: "desc" },
    select: {
      id: true,
      startedAt: true,
      endedAt: true,
      durationSec: true,
      description: true,
      categoryId: true,
      category: { select: { name: true } },
    },
  });

  // Compute durations (handle running session)
  const normalized = sessions.map((s) => {
    const isRunning = !s.endedAt;
    const dur =
      s.durationSec ?? (isRunning ? secondsBetween(s.startedAt, nowJs) : 0);

    return {
      id: s.id,
      startedAt: s.startedAt,
      endedAt: s.endedAt,
      durationSec: dur,
      description: s.description,
      categoryId: s.categoryId,
      categoryName: s.category.name,
      isRunning,
    };
  });

  // Today totals
  const todaySessions = normalized.filter(
    (s) => s.startedAt.getTime() >= todayStart.getTime(),
  );

  const todayTotal = todaySessions.reduce((acc, s) => acc + s.durationSec, 0);

  const todayByCategory = new Map<string, { name: string; seconds: number }>();
  for (const s of todaySessions) {
    const key = s.categoryId;
    const prev = todayByCategory.get(key);
    todayByCategory.set(key, {
      name: s.categoryName,
      seconds: (prev?.seconds ?? 0) + s.durationSec,
    });
  }

  // Week totals
  const weekTotal = normalized.reduce((acc, s) => acc + s.durationSec, 0);

  const weekByCategory = new Map<string, { name: string; seconds: number }>();
  for (const s of normalized) {
    const key = s.categoryId;
    const prev = weekByCategory.get(key);
    weekByCategory.set(key, {
      name: s.categoryName,
      seconds: (prev?.seconds ?? 0) + s.durationSec,
    });
  }

  const sortMap = (m: Map<string, { name: string; seconds: number }>) =>
    [...m.values()].sort((a, b) => b.seconds - a.seconds);

  const todayRows = sortMap(todayByCategory);
  const weekRows = sortMap(weekByCategory);

  return (
    <>
      <TimerRunningBanner />
      <main className="min-h-screen p-6 bg-neutral-50">
        <div className="mx-auto max-w-4xl space-y-6">
          <header className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">History</h1>
              <p className="text-sm text-neutral-600">
                Logged in as {userName}
              </p>
            </div>

            <div className="flex gap-2">
              <Link
                href="/tracker"
                className="rounded-xl border bg-white px-3 py-2 text-sm hover:bg-neutral-50"
              >
                Back to tracker
              </Link>
              <Link
                href="/logout"
                className="rounded-xl border bg-white px-3 py-2 text-sm hover:bg-neutral-50"
              >
                Log out
              </Link>
            </div>
          </header>

          {/* Totals cards */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="text-sm text-neutral-600">Today</div>
              <div className="mt-1 font-mono text-2xl">
                {formatHMS(todayTotal)}
              </div>
              <div className="mt-3 space-y-1">
                {todayRows.length ? (
                  todayRows.map((r) => (
                    <div key={r.name} className="flex justify-between text-sm">
                      <span className="text-neutral-700">{r.name}</span>
                      <span className="font-mono">{formatHMS(r.seconds)}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-neutral-500">
                    No sessions today.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="text-sm text-neutral-600">This week</div>
              <div className="mt-1 font-mono text-2xl">
                {formatHMS(weekTotal)}
              </div>
              <div className="mt-3 space-y-1">
                {weekRows.length ? (
                  weekRows.map((r) => (
                    <div key={r.name} className="flex justify-between text-sm">
                      <span className="text-neutral-700">{r.name}</span>
                      <span className="font-mono">{formatHMS(r.seconds)}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-neutral-500">
                    No sessions this week.
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Recent sessions */}
          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="text-sm font-medium text-neutral-700">
              Recent sessions
            </h2>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-neutral-500">
                  <tr className="border-b">
                    <th className="py-2 pr-3">Task</th>
                    <th className="py-2 pr-3">Start</th>
                    <th className="py-2 pr-3">End</th>
                    <th className="py-2 pr-3">Duration</th>
                    <th className="py-2">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {normalized.slice(0, 30).map((s) => (
                    <tr key={s.id} className="border-b last:border-b-0">
                      <td className="py-2 pr-3 font-medium">
                        {s.categoryName}
                        {s.isRunning ? (
                          <span className="ml-2 inline-flex rounded-full border border-emerald-600 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                            Running
                          </span>
                        ) : null}
                      </td>
                      <td className="py-2 pr-3">
                        {DateTime.fromJSDate(s.startedAt)
                          .setZone(TZ)
                          .toFormat("dd/LL HH:mm")}
                      </td>
                      <td className="py-2 pr-3">
                        {s.endedAt
                          ? DateTime.fromJSDate(s.endedAt)
                              .setZone(TZ)
                              .toFormat("dd/LL HH:mm")
                          : "—"}
                      </td>
                      <td className="py-2 pr-3 font-mono">
                        {formatHMS(s.durationSec)}
                      </td>
                      <td className="py-2 text-neutral-700">
                        {s.description ?? ""}
                      </td>
                    </tr>
                  ))}
                  {!normalized.length ? (
                    <tr>
                      <td className="py-3 text-neutral-500" colSpan={5}>
                        No sessions yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <p className="mt-3 text-xs text-neutral-500">
              Note: for now, totals are based on sessions by their start time.
              (We can add “split sessions over midnight” later if needed.)
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
