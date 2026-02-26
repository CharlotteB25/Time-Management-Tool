"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

type ActiveSession = {
  id: string;
  startedAt: string;
  description: string | null;
  user: { id: string; name: string; role: string };
  category: { id: string; name: string };
};

function formatHMS(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

// same palette trick you used in week view: stable, distinct colors
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

function categoryStyle(categoryId: string): React.CSSProperties {
  const idx = hashInt(categoryId) % PALETTE.length;
  const c = PALETTE[idx];
  return { backgroundColor: c.bg, borderColor: c.border, color: c.text };
}

export default function AdminLiveClient({
  activeSessions,
  totalActive,
}: {
  activeSessions: ActiveSession[];
  totalActive: number;
}) {
  const router = useRouter();
  const [now, setNow] = React.useState(() => Date.now());
  const [refreshing, startTransition] = React.useTransition();

  // tick every second for live elapsed timer
  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // auto refresh server data every 15s
  React.useEffect(() => {
    const t = setInterval(() => {
      startTransition(() => router.refresh());
    }, 15000);
    return () => clearInterval(t);
  }, [router]);

  async function onLogout() {
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <main className="min-h-screen bg-white text-black">
      {/* Header */}
      <div className="pt-10 pb-6 text-center px-6">
        <h1 className="text-3xl font-semibold tracking-tight">
          Admin Live Dashboard
        </h1>
        <div className="mx-auto mt-3 h-1 w-16 bg-red-600 rounded-full" />
        <p className="mt-3 text-sm text-neutral-600">
          Actieve timers:{" "}
          <span className="font-semibold text-neutral-900">{totalActive}</span>
          {refreshing ? (
            <span className="ml-2 text-xs">(updating…)</span>
          ) : null}
        </p>
      </div>

      <div className="px-6 pb-12">
        <div className="mx-auto w-full max-w-6xl space-y-4">
          {/* Top actions */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/admin/week"
              className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm hover:bg-neutral-50"
            >
              Week view
            </Link>

            <button
              type="button"
              onClick={() => startTransition(() => router.refresh())}
              className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm hover:bg-neutral-50"
            >
              Refresh now
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="rounded-xl bg-black px-3 py-2 text-sm text-white hover:bg-red-600 transition"
            >
              Log out
            </button>
          </div>

          {/* Empty state */}
          {activeSessions.length === 0 ? (
            <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm text-center">
              <div className="text-lg font-semibold">Geen actieve timers</div>
              <p className="mt-2 text-sm text-neutral-600">
                Niemand is momenteel aan het tracken.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activeSessions.map((s) => {
                const startMs = new Date(s.startedAt).getTime();
                const elapsedSec = Math.max(
                  0,
                  Math.floor((now - startMs) / 1000),
                );

                return (
                  <div
                    key={s.id}
                    className="rounded-2xl border bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm text-neutral-600">
                          Gebruiker
                        </div>
                        <div className="text-lg font-semibold">
                          {s.user.name}
                        </div>
                        <div className="text-xs text-neutral-500">
                          {s.user.role}
                        </div>
                      </div>

                      <div className="rounded-xl border border-neutral-200 px-3 py-2 font-mono text-base">
                        {formatHMS(elapsedSec)}
                      </div>
                    </div>

                    <div
                      className="mt-4 rounded-xl border px-3 py-2"
                      style={categoryStyle(s.category.id)}
                      title={s.category.name}
                    >
                      <div className="text-xs opacity-80">Categorie</div>
                      <div className="font-semibold">{s.category.name}</div>
                    </div>

                    {s.description ? (
                      <div className="mt-3 text-sm text-neutral-700">
                        <div className="text-xs text-neutral-500">
                          Omschrijving
                        </div>
                        <div className="line-clamp-2">{s.description}</div>
                      </div>
                    ) : (
                      <div className="mt-3 text-sm text-neutral-500">
                        Geen omschrijving
                      </div>
                    )}

                    <div className="mt-4 text-xs text-neutral-500">
                      Gestart om {new Date(s.startedAt).toLocaleTimeString()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="text-center text-xs text-neutral-500">
            Auto-refresh elke 15 seconden.
          </div>
        </div>
      </div>
    </main>
  );
}
