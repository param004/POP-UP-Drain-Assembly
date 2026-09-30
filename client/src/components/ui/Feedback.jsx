/** Full-bleed loading state with an animated hairline ring. */
export default function Spinner({ label = "Loading", className = "" }) {
  return (
    <div className={`flex flex-col items-center gap-4 ${className}`} role="status">
      <span className="relative block h-8 w-8" aria-hidden="true">
        <span className="absolute inset-0 rounded-full border border-shell-300" />
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-ink-900" />
      </span>
      <span className="eyebrow">{label}</span>
    </div>
  );
}

/** Card/panel-level placeholder used while product data resolves. */
export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-md bg-shell-200 ${className}`} />;
}

/** Error state with an optional retry affordance. */
export function ErrorState({ message, onRetry, className = "" }) {
  return (
    <div className={`flex flex-col items-center gap-4 text-center ${className}`}>
      <p className="text-sm text-ink-500">{message || "Something went wrong."}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full border border-ink-900 px-5 py-2 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] transition-colors hover:bg-ink-900 hover:text-shell-100"
        >
          Try again
        </button>
      )}
    </div>
  );
}

/** Empty-state block for carts, wishlists and search results. */
export function EmptyState({ title, body, action }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-shell-300 px-6 py-20 text-center">
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      {body && <p className="max-w-sm text-sm text-ink-500">{body}</p>}
      {action}
    </div>
  );
}
