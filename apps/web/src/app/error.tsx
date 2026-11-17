'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center">
        <h2 className="text-lg font-semibold">Application error</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">{error.message}</p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 rounded-md bg-[var(--primary)] px-4 py-2 text-sm text-[var(--primary-foreground)]"
        >
          Try again
        </button>
      </div>
    </div>
  );
}