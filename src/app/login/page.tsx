"use client";

import * as React from "react";
import { signIn } from "next-auth/react";

type User = {
  id: string;
  name: string;
  role: string;
};

export default function LoginPage() {
  const [users, setUsers] = React.useState<User[]>([]);
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then(setUsers);
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUser) return;

    setLoading(true);

    const callbackUrl =
      selectedUser.role === "ADMIN" ? "/admin/week" : "/tracker";

    await signIn("credentials", {
      userId: selectedUser.id,
      password,
      redirect: true,
      callbackUrl,
    });
  }

  return (
    <main className="min-h-screen bg-white text-black flex flex-col items-center justify-center p-6 relative">
      {/* Fullscreen loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center z-50">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-neutral-200 border-t-red-600" />
          <p className="mt-4 text-sm text-neutral-600">
            Inloggen… Even geduld.
          </p>
        </div>
      )}

      {/* Page title */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-semibold tracking-tight">
          Time Management Tool
        </h1>
        <div className="mx-auto mt-3 h-1 w-16 bg-red-600 rounded-full" />
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Selecteer je naam</label>
            <select
              className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600"
              onChange={(e) =>
                setSelectedUser(
                  users.find((u) => u.id === e.target.value) || null,
                )
              }
              defaultValue=""
              disabled={loading}
            >
              <option value="" disabled>
                Kies je naam
              </option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          {selectedUser?.role === "ADMIN" && (
            <div>
              <label className="text-sm font-medium">Wachtwoord (admin)</label>
              <input
                type="password"
                className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !selectedUser}
            className="w-full rounded-xl bg-black px-4 py-2.5 text-white font-medium transition hover:bg-red-600 disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {loading && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            {loading ? "Bezig…" : "Log in"}
          </button>
        </form>
      </div>
    </main>
  );
}
