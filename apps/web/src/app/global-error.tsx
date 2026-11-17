'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen items-center justify-center p-8">
          <div className="max-w-md rounded-xl border p-6 text-center shadow">
            <h2 className="text-lg font-semibold">SyncBoard failed to load</h2>
            <p className="mt-2 text-sm text-gray-600">{error.message}</p>
            <button type="button" onClick={reset} className="mt-4 rounded bg-indigo-600 px-4 py-2 text-sm text-white">
              Reload
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}