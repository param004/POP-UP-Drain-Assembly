import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";

/**
 * Support bubble, bottom-right. Stands in for a third-party widget (Intercom et al)
 * so no vendor script is required to demo the pattern — swap `onSubmit` for the
 * real widget's open() call when one is chosen.
 */
export default function ChatBubble() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(true);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState([
    { from: "agent", text: "Hi — questions about the drain? Ask away." },
  ]);
  const listRef = useRef(null);

  useEffect(() => {
    if (open) setUnread(false);
  }, [open]);

  useEffect(() => {
    // Keep the newest message in view.
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const send = (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setMessages((m) => [...m, { from: "user", text }]);
    setDraft("");

    // Canned reply so the widget demonstrates a full round trip.
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          from: "agent",
          text: "Got it. A specialist usually replies within a business day — or email us directly and we'll pick it up sooner.",
        },
      ]);
    }, 700);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="flex h-[26rem] w-[min(21rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-shell-300 bg-shell-50 shadow-2xl shadow-ink-900/15"
            role="dialog"
            aria-label="Support chat"
          >
            <header className="flex items-center justify-between border-b border-shell-300 bg-ink-800 px-4 py-3 text-shell-100">
              <div>
                <p className="text-sm font-semibold">Premier Products® Support</p>
                <p className="text-[0.6875rem] text-shell-300/70">
                  We usually reply within a day
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="grid h-7 w-7 place-items-center rounded-full transition-colors hover:bg-shell-100/10"
              >
                <svg
                  viewBox="0 0 16 16"
                  width="13"
                  height="13"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M3 3l10 10M13 3L3 13" />
                </svg>
              </button>
            </header>

            <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                    m.from === "user"
                      ? "ml-auto rounded-br-sm bg-ink-900 text-shell-100"
                      : "rounded-bl-sm bg-shell-200 text-ink-900"
                  }`}
                >
                  {m.text}
                </div>
              ))}
            </div>

            <form onSubmit={send} className="flex gap-2 border-t border-shell-300 p-3">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type a message…"
                aria-label="Message"
                className="min-w-0 flex-1 rounded-full border border-shell-300 bg-shell-100 px-3.5 py-2 text-sm outline-none focus:border-ink-900"
              />
              <button
                type="submit"
                aria-label="Send"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink-900 text-shell-100 transition-colors hover:bg-ink-800"
              >
                <svg
                  viewBox="0 0 16 16"
                  width="14"
                  height="14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M2 8l12-6-4 6 4 6-12-6z" />
                </svg>
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2">
        {open && (
          <Link
            to="/contact"
            onClick={() => setOpen(false)}
            className="rounded-full bg-shell-50 px-4 py-2.5 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-900 shadow-lg shadow-ink-900/10 transition-transform hover:scale-105"
          >
            Email us
          </Link>
        )}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close support chat" : "Open support chat"}
          aria-expanded={open}
          className="relative grid h-14 w-14 place-items-center rounded-full bg-ink-900 text-shell-100 shadow-xl shadow-ink-900/25 transition-transform duration-300 hover:scale-105 active:scale-95"
        >
          {unread && !open && (
            <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-brass-500 ring-2 ring-ink-900" />
          )}
          {open ? (
            <svg
              viewBox="0 0 16 16"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M3 3l10 10M13 3L3 13" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
              <path d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4V6a2 2 0 0 1 2-2z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
