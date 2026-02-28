import Link from "next/link";

export default function NotFound() {
  return (
    <div className="glass mx-auto mt-16 max-w-xl rounded-2xl p-6 text-center">
      <h2 className="ui-h2 text-2xl font-bold text-white">Page not found</h2>
      <p className="mt-2 text-slate-300">The page you requested does not exist or is no longer available.</p>
      <Link href="/" className="mt-4 inline-block rounded-lg bg-cyan-500 px-4 py-2 font-semibold text-slate-950 hover:bg-cyan-400">
        Back to home
      </Link>
    </div>
  );
}
