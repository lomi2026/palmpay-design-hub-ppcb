'use client';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void error;

  return (
    <main className="v9-source-home grid min-h-screen place-items-center bg-[var(--v9-bg)] p-6 text-center text-[var(--v9-text)]">
      <div>
        <h1 className="text-xl font-semibold">页面暂时不可用</h1>
        <button className="mt-4 underline" onClick={reset} type="button">
          重试
        </button>
      </div>
    </main>
  );
}
