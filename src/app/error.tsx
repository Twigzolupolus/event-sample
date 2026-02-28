"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="glass mx-auto mt-16 max-w-xl rounded-2xl p-6 text-center">
      <h2 className="ui-h2 text-2xl font-bold text-white">Something went wrong</h2>
      <p className="mt-2 text-slate-300">We hit an unexpected error. Please try again.</p>
      <button onClick={() => reset()} className="mt-4 rounded-lg bg-cyan-500 px-4 py-2 font-semibold text-slate-950 hover:bg-cyan-400">
        Retry
      </button>
    </div>
  );
}
