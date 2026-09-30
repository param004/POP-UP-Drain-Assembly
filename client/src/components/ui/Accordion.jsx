import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Single-open accordion. Uses a grid-rows transition rather than a height
 * animation so the panel animates to its natural height with no measurement.
 */
export default function Accordion({ items, allowMultiple = false, defaultOpen = null }) {
  const [open, setOpen] = useState(defaultOpen);

  const toggle = (i) => {
    if (allowMultiple) {
      setOpen((cur) => (cur.includes(i) ? cur.filter((n) => n !== i) : [...cur, i]));
    } else {
      setOpen((cur) => (cur === i ? null : i));
    }
  };

  return (
    <div className="border-t border-shell-300">
      {items.map((item, i) => {
        const isOpen = Array.isArray(open) ? open.includes(i) : open === i;
        return (
          <div key={item.q} className="border-b border-shell-300">
            <h3>
              <button
                type="button"
                onClick={() => toggle(i)}
                aria-expanded={isOpen}
                aria-controls={`faq-panel-${i}`}
                className="flex w-full items-start justify-between gap-6 py-6 text-left transition-colors hover:text-ink-500"
              >
                <span className="text-base font-semibold tracking-tight sm:text-lg">
                  {item.q}
                </span>
                <span
                  className="mt-1 grid h-6 w-6 shrink-0 place-items-center"
                  aria-hidden="true"
                >
                  <motion.svg
                    viewBox="0 0 16 16"
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <path d="M8 2v12M2 8h12" />
                  </motion.svg>
                </span>
              </button>
            </h3>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`faq-panel-${i}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <p className="max-w-2xl pb-7 pr-10 text-sm leading-relaxed text-ink-500">
                    {item.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
