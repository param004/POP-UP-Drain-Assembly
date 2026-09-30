import { useState } from "react";

/**
 * Newsletter capture. There is no mailing-list backend in the brief, so this
 * validates the address and confirms locally rather than posting anywhere —
 * wiring it to a provider is a one-line change in `onSubmit`.
 */
export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState("idle");

  const submit = (e) => {
    e.preventDefault();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!valid) {
      setState("invalid");
      return;
    }
    setState("done");
  };

  if (state === "done") {
    return (
      <p className="rounded-lg border border-shell-300 bg-shell-100 px-4 py-3 text-sm text-ink-500">
        Thanks — we&apos;ll be in touch when there&apos;s something worth sending.
      </p>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <label htmlFor="newsletter-email" className="eyebrow">
        Product updates
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id="newsletter-email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (state === "invalid") setState("idle");
          }}
          placeholder="you@example.com"
          aria-invalid={state === "invalid"}
          className={`min-w-0 flex-1 rounded-full border bg-shell-100 px-4 py-2.5 text-sm outline-none transition-colors ${
            state === "invalid" ? "border-brass-500" : "border-shell-300 focus:border-ink-900"
          }`}
        />
        <button
          type="submit"
          className="shrink-0 rounded-full bg-ink-900 px-5 py-2.5 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-shell-100 transition-colors hover:bg-ink-800"
        >
          Join
        </button>
      </div>
      {state === "invalid" && (
        <p className="mt-2 text-xs text-brass-500">Please enter a valid email address.</p>
      )}
    </form>
  );
}
