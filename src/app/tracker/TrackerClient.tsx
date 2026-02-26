"use client";

import * as React from "react";
import { startSession, stopSession } from "./actions";
import Link from "next/link";
import { LogoutButton } from "@/src/components/LogoutButton";

type Category = {
  id: string;
  name: string;
};

type OpenSession = {
  id: string;
  startedAt: string;
  categoryId: string;
  description: string | null;
  categoryName: string;
};

function formatHMS(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export default function TrackerClient({
  categories,
  openSession,
  userName,
}: {
  categories: Category[];
  openSession: OpenSession | null;
  userName: string;
}) {
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string>(
    openSession?.categoryId ?? categories[0]?.id ?? "",
  );
  const [description, setDescription] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);

  const selectedCategory = React.useMemo(
    () => categories.find((c) => c.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId],
  );

  const requiresDescription = React.useCallback(
    (categoryId: string) => {
      const c = categories.find((x) => x.id === categoryId);
      return (c?.name ?? "").trim().toLowerCase() === "overige taken";
    },
    [categories],
  );

  const selectedRequiresDescription = selectedCategory
    ? requiresDescription(selectedCategory.id)
    : false;

  React.useEffect(() => {
    if (!openSession) {
      setElapsed(0);
      return;
    }
    const start = new Date(openSession.startedAt).getTime();
    const tick = () =>
      setElapsed(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [openSession?.id, openSession?.startedAt]);

  React.useEffect(() => {
    // Keep dropdown synced to running task
    if (openSession?.categoryId) setSelectedCategoryId(openSession.categoryId);
  }, [openSession?.categoryId]);

  async function onStop() {
    setBusy(true);
    try {
      await stopSession();
    } finally {
      setBusy(false);
    }
  }

  async function onStartOrSwitch() {
    if (!selectedCategoryId) return;
    if (busy) return;

    // If same as running, do nothing
    if (openSession?.categoryId === selectedCategoryId) return;

    // Validation: Overige taken requires description
    if (requiresDescription(selectedCategoryId) && !description.trim()) {
      setError("Omschrijving is verplicht bij ‘Overige taken’.");
      return;
    }

    setError(null);
    setBusy(true);
    try {
      await startSession(selectedCategoryId, description.trim());
      setDescription("");
    } finally {
      setBusy(false);
    }
  }

  const primaryLabel = openSession ? "Switch task" : "Start task";

  return (
    <main className="min-h-screen bg-white text-black flex flex-col">
      {/* Page header (outside card) */}
      <div className="pt-12 pb-6 text-center px-6">
        <h1 className="text-3xl font-semibold tracking-tight">Time Tracker</h1>
        <div className="mx-auto mt-3 h-1 w-16 bg-red-600 rounded-full" />
        <p className="mt-3 text-sm text-neutral-600">
          Ingelogd als{" "}
          <span className="font-medium text-neutral-900">{userName}</span>
        </p>
      </div>

      <div className="flex-1 px-6 pb-12">
        <div className="mx-auto w-full max-w-3xl space-y-4">
          {/* Top actions */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/history"
              className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm hover:bg-neutral-50"
            >
              Bekijk historiek
            </Link>
            <LogoutButton />
          </div>

          {/* Current session card */}
          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-medium text-neutral-700">
                  Huidige taak
                </h2>
                {openSession ? (
                  <>
                    <div className="mt-2 text-lg font-semibold">
                      {openSession.categoryName}
                    </div>
                    <div className="mt-1 text-sm text-neutral-600">
                      Gestart om{" "}
                      {new Date(openSession.startedAt).toLocaleTimeString()}
                      {openSession.description
                        ? ` · ${openSession.description}`
                        : ""}
                    </div>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-neutral-600">
                    Geen actieve timer. Kies een taak en start.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-xl border border-neutral-200 px-4 py-2 font-mono text-lg">
                  {formatHMS(elapsed)}
                </div>
                <button
                  onClick={onStop}
                  disabled={busy || !openSession}
                  className="rounded-xl bg-black px-4 py-2 text-white disabled:opacity-50 hover:bg-red-600 transition"
                >
                  Stop
                </button>
              </div>
            </div>
          </section>

          {/* Start/Switch card */}
          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-medium text-neutral-700">
              {openSession ? "Taak wijzigen" : "Taak starten"}
            </h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {/* Category dropdown */}
              <div>
                <label className="text-sm font-medium">Categorie</label>
                <select
                  className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 transition disabled:opacity-60"
                  value={selectedCategoryId}
                  onChange={(e) => {
                    setSelectedCategoryId(e.target.value);
                    if (error) setError(null);
                  }}
                  disabled={busy}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                {openSession?.categoryId === selectedCategoryId ? (
                  <p className="mt-2 text-xs text-neutral-500">
                    Deze taak is momenteel actief.
                  </p>
                ) : null}
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium">
                  {selectedRequiresDescription
                    ? "Omschrijving (verplicht bij ‘Overige taken’)"
                    : "Omschrijving (optioneel)"}
                </label>
                <input
                  className={[
                    "mt-2 w-full rounded-xl border px-3 py-2 transition focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 disabled:opacity-60",
                    selectedRequiresDescription
                      ? "border-amber-400 bg-amber-50"
                      : "border-neutral-300 bg-white",
                  ].join(" ")}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder={
                    selectedRequiresDescription
                      ? "Omschrijf kort wat je doet…"
                      : "Extra info voor admin (optioneel)"
                  }
                  disabled={busy}
                />
                {error ? (
                  <p className="mt-2 text-sm text-red-600">{error}</p>
                ) : null}
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-neutral-600">
                {openSession
                  ? "Klik op ‘Switch task’ om direct van taak te veranderen."
                  : "Klik op ‘Start task’ om direct te starten."}
              </p>

              <button
                type="button"
                onClick={onStartOrSwitch}
                disabled={
                  busy ||
                  !selectedCategoryId ||
                  openSession?.categoryId === selectedCategoryId ||
                  (selectedRequiresDescription && !description.trim())
                }
                className="rounded-xl bg-black px-4 py-2.5 text-white font-medium transition hover:bg-red-600 disabled:opacity-50 active:scale-[0.99]"
              >
                {primaryLabel}
              </button>
            </div>
          </section>

          {/* Privacy note */}
          <div className="text-center text-xs text-neutral-500">
            We registreren tijd per taakcategorie voor workload planning en
            interne rapportage. Geen locatie tracking en geen activity
            monitoring.
          </div>
        </div>
      </div>
    </main>
  );
}
