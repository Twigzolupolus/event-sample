import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Twigzolupolus Events",
  description: "Public event directory",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const year = new Date().getFullYear();

  return (
    <html lang="en">
      <body id="top">
        <main className="premium-shell mx-auto min-h-screen max-w-6xl px-4 py-8 md:px-6">
          <header className="glass mb-8 flex items-center justify-between rounded-2xl px-5 py-4">
            <Link href="/" className="text-lg font-semibold tracking-wide text-white">
              <span className="bg-gradient-to-r from-cyan-300 to-violet-300 bg-clip-text text-transparent">TWIGZOLUPOLUS</span>
            </Link>
            <div className="flex gap-2">
            <Link href="/join" className="rounded-lg border border-cyan-300/30 px-3 py-1.5 text-sm text-cyan-200 hover:bg-cyan-300/10">Join Event</Link>
            <Link href="/admin" className="rounded-lg border border-white/20 px-3 py-1.5 text-sm text-slate-200 hover:bg-white/10">
              Admin
            </Link>
            </div>
          </header>

          {children}

          <footer className="mt-12 border-t border-white/15 pt-6 text-center text-sm text-slate-300">
            <p>© {year} Twigzolupolus. All rights reserved.</p>
          </footer>

          <a
            href="#top"
            aria-label="Back to top"
            title="Back to top"
            className="fixed bottom-6 right-6 grid h-11 w-11 place-items-center rounded-full border border-cyan-300/35 bg-gradient-to-br from-slate-900/90 to-slate-800/90 text-cyan-200 shadow-lg shadow-cyan-500/20 backdrop-blur transition hover:-translate-y-0.5 hover:border-cyan-200 hover:text-white"
          >
            <span className="text-lg leading-none">↑</span>
          </a>
        </main>
      </body>
    </html>
  );
}
