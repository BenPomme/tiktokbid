"use client";

import { FormEvent, useState } from "react";

type AdminListing = {
  id: string;
  title: string;
  source: "paid" | "trending";
  activeTotalCents: number;
  clickCount: number;
  hidden: boolean;
  createdAt: string;
};

type AdminClientProps = {
  listings: AdminListing[];
};

export function AdminClient({ listings: initial }: AdminClientProps) {
  const [password, setPassword] = useState("");
  const [listings, setListings] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function hideListing(id: string) {
    setError(null);
    if (!password) {
      setError("Enter the admin password first.");
      return;
    }

    setPendingId(id);
    try {
      const res = await fetch("/api/admin/hide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, password }),
      });

      let data: { error?: string } | null = null;
      try {
        data = (await res.json()) as { error?: string };
      } catch {
        data = null;
      }

      if (!res.ok) {
        setError(data?.error ?? `Hide failed (${res.status}).`);
        return;
      }

      setListings((prev) =>
        prev.map((row) => (row.id === id ? { ...row, hidden: true } : row)),
      );
    } catch {
      setError("Could not reach hide API.");
    } finally {
      setPendingId(null);
    }
  }

  function onPasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onPasswordSubmit} className="space-y-2">
        <label className="block text-sm font-medium" htmlFor="admin-password">
          Admin password
        </label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full max-w-sm rounded border border-zinc-300 px-3 py-2 text-sm"
          placeholder="Required for each hide"
        />
        <p className="text-xs text-zinc-500">
          Password is sent with each hide action (not stored as a session).
        </p>
      </form>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-zinc-200">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600">
            <tr>
              <th className="px-3 py-2 font-medium">Title</th>
              <th className="px-3 py-2 font-medium">Source</th>
              <th className="px-3 py-2 font-medium text-right">Active</th>
              <th className="px-3 py-2 font-medium text-right">Clicks</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {listings.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-4 text-center text-zinc-500"
                >
                  No listings yet.
                </td>
              </tr>
            ) : (
              listings.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-zinc-100 last:border-0"
                >
                  <td className="px-3 py-2 font-medium">{row.title}</td>
                  <td className="px-3 py-2 text-zinc-600">{row.source}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    ${(row.activeTotalCents / 100).toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {row.clickCount}
                  </td>
                  <td className="px-3 py-2">
                    {row.hidden ? (
                      <span className="text-zinc-400">hidden</span>
                    ) : (
                      <span className="text-emerald-700">visible</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      disabled={row.hidden || pendingId === row.id}
                      onClick={() => void hideListing(row.id)}
                      className="rounded bg-zinc-900 px-2 py-1 text-xs font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-300"
                    >
                      {row.hidden
                        ? "Hidden"
                        : pendingId === row.id
                          ? "Hiding…"
                          : "Hide"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
