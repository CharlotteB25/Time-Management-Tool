import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const TZ = "Europe/Brussels";

export async function TimerRunningBanner() {
  const session = await auth();
  const userId = session?.user?.id;
  const role = session?.user?.role;

  // Admins don't need tracker/history banner
  if (!userId || role === "ADMIN") return null;

  const running = await prisma.timeSession.findFirst({
    where: { userId, endedAt: null },
    orderBy: { startedAt: "desc" },
    select: {
      startedAt: true,
      description: true,
      category: { select: { name: true } },
    },
  });

  if (!running) return null;

  const title = running.category?.name ?? "Running timer";
  const desc = running.description?.trim();

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-semibold text-amber-900">
            ⏱ Timer is running: {title}
          </div>
          {desc ? (
            <div className="text-amber-900/80">{desc}</div>
          ) : (
            <div className="text-amber-900/60">No description</div>
          )}
        </div>

        <Link
          href="/tracker"
          className="inline-flex w-fit items-center justify-center rounded-xl border bg-white px-3 py-2 text-sm hover:bg-neutral-50"
        >
          Go to tracker
        </Link>
      </div>
    </div>
  );
}
