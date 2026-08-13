/**
 * The route-level loading state. Without one, a navigation that waits on a
 * server component shows the previous page frozen — indistinguishable from a
 * tap that did not register.
 *
 * Mirrors the skeleton shape the pages use, so the transition into content
 * does not jump.
 */
export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-1 py-2" role="status" aria-busy="true">
      <span className="sr-only">Memuat halaman…</span>
      <div className="skeleton mb-6 h-8 w-48 rounded" />
      <div className="space-y-3">
        <div className="skeleton h-32 rounded-2xl" />
        <div className="skeleton h-32 rounded-2xl" />
        <div className="skeleton h-32 rounded-2xl" />
      </div>
    </div>
  );
}
