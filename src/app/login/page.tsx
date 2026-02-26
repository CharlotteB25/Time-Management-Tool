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

  React.useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then(setUsers);
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUser) return;

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
    <main className="min-h-screen bg-white text-black flex flex-col">
      {/* Page Header (outside card) */}
      <div className="pt-16 pb-8 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          Time Management Tool
        </h1>
        <div className="mx-auto mt-3 h-1 w-16 bg-red-600 rounded-full" />
      </div>

      {/* Centered Card */}
      <div className="flex flex-1 items-start justify-center px-6">
        <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
          <h2 className="text-lg font-semibold mb-6">Log in to continue</h2>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Name Select */}
            <div>
              <label className="text-sm font-medium">Selecteer je naam</label>
              <select
                className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 transition"
                onChange={(e) =>
                  setSelectedUser(
                    users.find((u) => u.id === e.target.value) || null,
                  )
                }
                defaultValue=""
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

            {/* Admin Password */}
            {selectedUser?.role === "ADMIN" && (
              <div>
                <label className="text-sm font-medium">Admin wachtwoord</label>
                <input
                  type="password"
                  className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 transition"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              className="w-full rounded-xl bg-black px-4 py-2.5 text-white font-medium transition hover:bg-red-600 active:scale-[0.99]"
            >
              Log in
            </button>
          </form>
        </div>
      </div>

      {/* Subtle Footer */}
      <div className="pb-10 text-center text-xs text-neutral-500">
        © {new Date().getFullYear()} Leie Auto’s
      </div>
    </main>
  );
}
