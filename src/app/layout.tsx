import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "TikTokBid",
  description: "US TikTok Shop pay-to-rank board",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <nav className="border-b border-zinc-200 bg-white">
          <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-3 text-sm">
            <Link
              href="/"
              className="font-semibold text-zinc-900 hover:text-sky-700"
            >
              TikTokBid
            </Link>
            <Link
              href="/rules"
              className="text-zinc-600 underline-offset-2 hover:text-sky-700 hover:underline"
            >
              Rules
            </Link>
            <Link
              href="/about"
              className="text-zinc-600 underline-offset-2 hover:text-sky-700 hover:underline"
            >
              About
            </Link>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
