"use client";

import Link from "next/link";

export default function LogError({
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <div className="mx-auto grid max-w-lg gap-4 px-6 py-16">
      <p className="text-lg">This log hit a problem</p>
      <div className="flex gap-4 text-sm">
        <Link href="/" className="text-stamp underline">
          Back to the log
        </Link>
        <button type="button" onClick={() => retry()} className="text-muted">
          Try again
        </button>
      </div>
    </div>
  );
}
