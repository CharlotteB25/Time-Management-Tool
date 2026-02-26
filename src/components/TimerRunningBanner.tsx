import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function TimerRunningBanner() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const open = await prisma.timeSession.findFirst({
    where: { userId, endedAt: null },
    orderBy: { startedAt: "desc" },
    select: {
      startedAt: true,
      description: true,
      category: { select: { name: true } },
    },
  });

  if (!open) return null;

  return (
    <div className="w-full border-b border-red-200 bg-red-50 px-4 py-2 text-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <div className="text-neutral-900">
          <span className="font-semibold">Timer loopt:</span>{" "}
          {open.category.name}
          {open.description ? (
            <span className="text-neutral-700"> · {open.description}</span>
          ) : null}
          <span className="ml-2 text-neutral-600">
            (gestart om{" "}
            {open.startedAt.toLocaleTimeString("nl-BE", {
              hour: "2-digit",
              minute: "2-digit",
            })}
            )
          </span>
        </div>

        <Link
          href="/tracker"
          className="rounded-lg bg-black px-3 py-1.5 text-xs text-white hover:bg-red-600 transition"
        >
          Naar tracker
        </Link>
      </div>
    </div>
  );
}
