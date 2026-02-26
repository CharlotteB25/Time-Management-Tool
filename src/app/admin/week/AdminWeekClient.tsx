"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DateTime } from "luxon";
import { signOut } from "next-auth/react";
import Link from "next/link";

const TZ = "Europe/Brussels";

// 06:00 → 19:00
const START_MIN = 6 * 60;
const END_MIN = 19 * 60;
const SLOT_MIN = 30;

const ROWS = (END_MIN - START_MIN) / SLOT_MIN; // 26
const TIME_COL_W = 86; // slightly slimmer to help fit

type UserLite = { id: string; name: string; role: string };

type Segment = {
  id: string;
  dayIndex: number; // 0=Mon ... 6=Sun
  startMin: number;
  endMin: number;
  categoryId: string;
  categoryName: string;
  description: string | null;
};

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function fmtHHMM(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function mondayOf(date: DateTime) {
  const daysBack = date.weekday - 1;
  return date.minus({ days: daysBack }).startOf("day");
}

function toGridRow(minsSinceMidnight: number) {
  const clamped = clamp(minsSinceMidnight, START_MIN, END_MIN);
  return Math.floor((clamped - START_MIN) / SLOT_MIN) + 2;
}

function toGridRowEnd(startMin: number, endMin: number) {
  const s = clamp(startMin, START_MIN, END_MIN);
  const e = clamp(endMin, START_MIN, END_MIN);
  const span = Math.max(1, Math.ceil((e - s) / SLOT_MIN));
  return toGridRow(s) + span;
}

/**
 * Distinct palette (stable + readable).
 * We map categoryId -> index so categories keep the same color for a given user.
 */
const PALETTE = [
  { bg: "hsl(15 90% 92%)", border: "hsl(15 80% 45%)", text: "hsl(15 80% 20%)" },
  { bg: "hsl(40 95% 90%)", border: "hsl(40 85% 45%)", text: "hsl(40 80% 18%)" },
  { bg: "hsl(90 60% 90%)", border: "hsl(90 45% 35%)", text: "hsl(90 55% 18%)" },
  {
    bg: "hsl(160 55% 90%)",
    border: "hsl(160 55% 32%)",
    text: "hsl(160 55% 16%)",
  },
  {
    bg: "hsl(205 85% 92%)",
    border: "hsl(205 75% 40%)",
    text: "hsl(205 75% 18%)",
  },
  {
    bg: "hsl(230 75% 94%)",
    border: "hsl(230 60% 45%)",
    text: "hsl(230 60% 18%)",
  },
  {
    bg: "hsl(275 70% 94%)",
    border: "hsl(275 55% 45%)",
    text: "hsl(275 55% 18%)",
  },
  {
    bg: "hsl(330 80% 94%)",
    border: "hsl(330 65% 45%)",
    text: "hsl(330 65% 18%)",
  },
];

function hashInt(input: string) {
  let h = 0;
  for (let i = 0; i < input.length; i++)
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return h;
}

function blockStyle(categoryId: string) {
  const idx = hashInt(categoryId) % PALETTE.length;
  const c = PALETTE[idx];
  return {
    backgroundColor: c.bg,
    borderColor: c.border,
    color: c.text,
  } as React.CSSProperties;
}

export default function AdminWeekClient({
  users,
  selectedUserId,
  selectedUserName,
  weekISO,
  segments,
}: {
  users: UserLite[];
  selectedUserId: string;
  selectedUserName: string;
  weekISO: string;
  segments: Segment[];
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [isPending, startTransition] = React.useTransition();

  const weekStart = DateTime.fromISO(weekISO, { zone: TZ }).startOf("day");
  const days = Array.from({ length: 7 }, (_, i) => weekStart.plus({ days: i }));

  const segmentsByDay = React.useMemo(() => {
    const map = new Map<number, Segment[]>();
    for (let i = 0; i < 7; i++) map.set(i, []);
    for (const s of segments) map.get(s.dayIndex)?.push(s);
    for (const [k, v] of map.entries()) {
      v.sort((a, b) => a.startMin - b.startMin);
      map.set(k, v);
    }
    return map;
  }, [segments]);

  function navigate(next: { userId?: string; week?: string }) {
    const params = new URLSearchParams(sp?.toString());
    const baseUserId = params.get("userId") ?? selectedUserId;
    const baseWeek = params.get("week") ?? weekISO;

    params.set("userId", next.userId ?? baseUserId);
    params.set("week", next.week ?? baseWeek);

    const url = `/admin/week?${params.toString()}`;

    startTransition(() => {
      router.replace(url);
      router.refresh();
    });
  }

  function onPrevWeek() {
    navigate({ week: weekStart.minus({ weeks: 1 }).toISODate()! });
  }
  function onNextWeek() {
    navigate({ week: weekStart.plus({ weeks: 1 }).toISODate()! });
  }

  async function onLogout() {
    await signOut({ callbackUrl: "/login" });
  }

  /**
   * Make the grid fit the viewport height:
   * - header row: 44px
   * - leave some space for page header + paddings
   */
  const [rowH, setRowH] = React.useState(26);

  React.useEffect(() => {
    const compute = () => {
      // Rough available height: viewport - outer paddings - header area - some breathing room
      const vh = window.innerHeight;
      const reserved = 220; // header + spacing (tweak if needed)
      const headerRow = 55;
      const available = Math.max(320, vh - reserved - headerRow);
      const h = Math.floor(available / ROWS);
      setRowH(clamp(h, 22, 34)); // keep readable
    };

    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  const gridCols = `${TIME_COL_W}px repeat(7, minmax(0, 1fr))`;
  const gridRows = `55px repeat(${ROWS}, ${rowH}px)`;

  return (
    <main className="min-h-screen p-6 bg-white text-black">
      <div className="mx-auto max-w-7xl space-y-4">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Admin — Week overview
            </h1>

            <p className="text-sm text-neutral-600">
              Viewing:{" "}
              <span className="font-medium text-neutral-900">
                {selectedUserName}
              </span>
              {isPending ? (
                <span className="ml-2 text-xs">(loading…)</span>
              ) : null}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/live"
              className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm hover:bg-neutral-50"
            >
              Live dashboard
            </Link>
            <select
              className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 disabled:opacity-60"
              value={selectedUserId}
              disabled={isPending}
              onChange={(e) => navigate({ userId: e.target.value })}
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>

            <button
              className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm hover:bg-neutral-50 disabled:opacity-60"
              onClick={onPrevWeek}
              disabled={isPending}
              type="button"
            >
              ← Previous
            </button>

            <input
              className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 disabled:opacity-60"
              type="date"
              value={weekISO}
              disabled={isPending}
              onChange={(e) => {
                const d = DateTime.fromISO(e.target.value, { zone: TZ });
                const monday = d.isValid ? mondayOf(d) : weekStart;
                navigate({ week: monday.toISODate()! });
              }}
            />

            <button
              className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm hover:bg-neutral-50 disabled:opacity-60"
              onClick={onNextWeek}
              disabled={isPending}
              type="button"
            >
              Next →
            </button>

            <button
              className="rounded-xl bg-black px-3 py-2 text-sm text-white hover:bg-red-600 transition"
              onClick={onLogout}
              type="button"
            >
              Log out
            </button>
          </div>
        </header>

        {/* Calendar (no horizontal scroll; fits width) */}
        <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
          <div
            className="grid w-full"
            style={{
              gridTemplateColumns: gridCols,
              gridTemplateRows: gridRows,
            }}
          >
            {/* Top-left */}
            <div
              className="border-b border-r bg-neutral-50 text-xs font-medium text-neutral-600 flex items-center justify-center"
              style={{ gridColumn: 1, gridRow: 1 }}
            >
              Time
            </div>

            {/* Day headers */}
            {days.map((d, i) => (
              <div
                key={d.toISODate()}
                className="border-b border-r bg-neutral-50 px-3 py-2 flex flex-col justify-center"
                style={{ gridColumn: i + 2, gridRow: 1 }}
              >
                <div className="text-[11px] uppercase tracking-wide text-neutral-500 leading-none">
                  {d.toFormat("cccc")}
                </div>
                <div className="text-sm font-semibold text-neutral-900 leading-tight mt-1">
                  {d.toFormat("dd/LL")}
                </div>
              </div>
            ))}

            {/* Time labels */}
            {Array.from({ length: ROWS }, (_, r) => {
              const mins = START_MIN + r * SLOT_MIN;
              const isHour = mins % 60 === 0;
              return (
                <div
                  key={mins}
                  className={[
                    "border-b border-r bg-white flex items-center justify-center",
                    isHour
                      ? "text-xs text-neutral-600"
                      : "text-[10px] text-neutral-400",
                  ].join(" ")}
                  style={{ gridColumn: 1, gridRow: r + 2 }}
                >
                  {isHour ? fmtHHMM(mins) : ""}
                </div>
              );
            })}

            {/* Background grid cells */}
            {Array.from({ length: 7 }, (_, dayIndex) =>
              Array.from({ length: ROWS }, (_, r) => {
                const mins = START_MIN + r * SLOT_MIN;
                const isHourLine = mins % 60 === 0;

                return (
                  <div
                    key={`${dayIndex}-${r}`}
                    className={[
                      "border-r border-b",
                      r % 2 === 0 ? "bg-white" : "bg-neutral-50/30",
                      isHourLine
                        ? "border-b-neutral-300"
                        : "border-b-neutral-200",
                    ].join(" ")}
                    style={{ gridColumn: dayIndex + 2, gridRow: r + 2 }}
                  />
                );
              }),
            )}

            {/* Segments */}
            {Array.from({ length: 7 }, (_, dayIndex) => {
              const daySegments = segmentsByDay.get(dayIndex) ?? [];
              return daySegments.map((s) => {
                const rowStart = toGridRow(s.startMin);
                const rowEnd = toGridRowEnd(s.startMin, s.endMin);

                return (
                  <div
                    key={s.id}
                    className="mx-1 my-0.5 rounded-xl border px-2 py-1 text-[12px] leading-tight shadow-sm overflow-hidden"
                    style={{
                      gridColumn: dayIndex + 2,
                      gridRowStart: rowStart,
                      gridRowEnd: rowEnd,
                      ...blockStyle(s.categoryId),
                    }}
                    title={
                      s.description
                        ? `${s.categoryName} — ${s.description}`
                        : s.categoryName
                    }
                  >
                    <div className="font-semibold truncate">
                      {s.categoryName}
                    </div>
                    {s.description ? (
                      <div className="opacity-80 truncate">{s.description}</div>
                    ) : null}
                    <div className="mt-1 font-mono opacity-80">
                      {fmtHHMM(s.startMin)} – {fmtHHMM(s.endMin)}
                    </div>
                  </div>
                );
              });
            })}
          </div>
        </section>

        <p className="text-xs text-neutral-500">
          Tip: this view auto-scales row height to fit your screen
          (06:00–19:00).
        </p>
      </div>
    </main>
  );
}
