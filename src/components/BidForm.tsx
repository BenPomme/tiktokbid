"use client";

import { FormEvent, useState } from "react";
import { MIN_BID_CENTS } from "@/lib/money";

const MIN_DOLLARS = MIN_BID_CENTS / 100;

export function BidForm() {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState<string>(String(MIN_DOLLARS));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const amountNumber = Number(amount);
    if (!Number.isFinite(amountNumber) || amountNumber < MIN_DOLLARS) {
      setError(`Minimum bid is $${MIN_DOLLARS.toFixed(2)}.`);
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          title: title.trim(),
          amount: amountNumber,
        }),
      });

      let data: { url?: string; error?: string } | null = null;
      try {
        data = (await res.json()) as { url?: string; error?: string };
      } catch {
        data = null;
      }

      if (!res.ok) {
        setError(
          data?.error ??
            `Checkout unavailable (${res.status}). Try again later.`,
        );
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      setError("Checkout response missing redirect URL.");
    } catch {
      setError("Could not reach checkout. Try again later.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="space-y-3" aria-label="Place a bid">
      <h2 className="text-lg font-semibold">Place a bid</h2>
      <form onSubmit={onSubmit} className="space-y-3 max-w-md">
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-zinc-700">TikTok Shop URL</span>
          <input
            type="url"
            name="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.tiktok.com/shop/..."
            className="w-full rounded-md border border-zinc-300 px-3 py-2"
          />
        </label>

        <label className="block space-y-1 text-sm">
          <span className="font-medium text-zinc-700">Title</span>
          <input
            type="text"
            name="title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Product title"
            className="w-full rounded-md border border-zinc-300 px-3 py-2"
          />
        </label>

        <label className="block space-y-1 text-sm">
          <span className="font-medium text-zinc-700">
            Amount (USD, min ${MIN_DOLLARS.toFixed(2)})
          </span>
          <input
            type="number"
            name="amount"
            required
            min={MIN_DOLLARS}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-md border border-zinc-300 px-3 py-2"
          />
        </label>

        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "Starting checkout…" : "Bid with Stripe"}
        </button>
      </form>
    </section>
  );
}
