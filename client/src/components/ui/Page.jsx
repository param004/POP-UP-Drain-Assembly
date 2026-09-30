import { Link } from "react-router-dom";
import Reveal from "../ui/Reveal.jsx";

/** Consistent page masthead for the interior pages. */
export default function PageHeader({ eyebrow, title, lede, children }) {
  return (
    <div className="border-b border-shell-300">
      <div className="mx-auto max-w-[1400px] px-5 pb-14 pt-14 sm:px-8 sm:pb-20 sm:pt-20">
        <Reveal>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1 className="display mt-3 text-[clamp(2rem,5vw,3.5rem)]">{title}</h1>
          {lede && (
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-ink-500 sm:text-base">
              {lede}
            </p>
          )}
          {children}
        </Reveal>
      </div>
    </div>
  );
}

/** Labelled input with error text wired up for assistive tech. */
export function Field({ label, name, error, hint, as = "input", className = "", ...props }) {
  const id = `f-${name}`;
  const Tag = as;
  const base =
    "h-11 w-full rounded-full border bg-shell-50 px-4 text-sm outline-none transition-colors placeholder:text-ink-300 focus:border-ink-900 disabled:opacity-50";
  const state = error ? "border-brass-500" : "border-shell-300";

  return (
    <div className={className}>
      <label htmlFor={id} className="eyebrow block">
        {label}
      </label>
      <Tag
        id={id}
        name={name}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error || hint ? `${id}-msg` : undefined}
        className={`mt-2 ${base} ${state} ${as === "textarea" ? "h-auto py-3" : ""}`}
        {...props}
      />
      {(error || hint) && (
        <p id={`${id}-msg`} className="mt-1.5 px-1 text-xs text-ink-400">
          {error ? <span className="text-brass-500">{error}</span> : hint}
        </p>
      )}
    </div>
  );
}

/** Two-column grid wrapper for form rows. */
export function Row({ children, className = "" }) {
  return <div className={`grid gap-4 sm:grid-cols-2 ${className}`}>{children}</div>;
}

/** Banner for form-level success/error feedback. */
export function Banner({ tone = "info", children }) {
  const tones = {
    info: "border-shell-300 bg-shell-200/60 text-ink-700",
    error: "border-brass-500/40 bg-brass-500/5 text-brass-500",
    success: "border-emerald-600/30 bg-emerald-600/5 text-emerald-800",
  };
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-lg border px-4 py-3 text-sm ${tones[tone]}`}
    >
      {children}
    </p>
  );
}

/** Slim rule used to separate form sections. */
export function SectionTitle({ children, note }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-shell-300 pt-8">
      <h2 className="text-sm font-semibold uppercase tracking-[0.14em]">{children}</h2>
      {note && <span className="text-xs text-ink-400">{note}</span>}
    </div>
  );
}

export { Link };
