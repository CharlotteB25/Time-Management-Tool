export default function LoadingTracker() {
  return (
    <main className="min-h-screen bg-white text-black flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-neutral-200 border-t-red-600" />
        <h1 className="mt-4 text-lg font-semibold">Tracker laden…</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Even geduld. We halen je gegevens op.
        </p>
      </div>
    </main>
  );
}
