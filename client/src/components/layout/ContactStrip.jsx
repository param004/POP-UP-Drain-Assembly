import { BUSINESS } from "../../data/content.js";

/*
 * A dark contact strip: address, phone, email.
 *
 * Each item pairs a circular icon badge with a small label above the value. The
 * address is the widest item, so the three columns are weighted 2fr / 1fr / 1fr
 * and stack on narrow screens.
 */

/** Map pin, drawn on a 24-unit grid to match a 20px box. */
function PinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 10.5c0 5.4-8 12-8 12s-8-6.6-8-12a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10.3" r="2.9" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6.6 3.5h2.9l1.5 3.7-1.9 1.4a12.4 12.4 0 0 0 5.3 5.3l1.4-1.9 3.7 1.5v2.9a2 2 0 0 1-2.2 2A16.9 16.9 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2Z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2.8" y="5" width="18.4" height="14" rx="2.2" />
      <path d="m3.4 6.6 8.6 6 8.6-6" />
    </svg>
  );
}

const ITEMS = [
  {
    label: "Address",
    Icon: PinIcon,
    render: () => (
      <address className="not-italic">
        {BUSINESS.addressLines.map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </address>
    ),
  },
  {
    label: "Phone",
    Icon: PhoneIcon,
    render: () => (
      <a href={`tel:${BUSINESS.phoneDial}`} className="transition-colors hover:text-white">
        {BUSINESS.phoneDisplay}
      </a>
    ),
  },
  {
    label: "Email",
    Icon: MailIcon,
    render: () => (
      <a
        href={`mailto:${BUSINESS.email}`}
        className="break-all transition-colors hover:text-white"
      >
        {BUSINESS.email}
      </a>
    ),
  },
];

export default function ContactStrip() {
  return (
    <section aria-label="Contact details" className="bg-ink-900 text-white">
      <div className="mx-auto max-w-[1400px] px-5 py-10 sm:px-8 sm:py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr] lg:gap-12">
          {ITEMS.map(({ label, Icon, render }) => (
            <div key={label} className="flex items-start gap-4">
              <span className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                <Icon />
              </span>
              <div className="min-w-0">
                <p className="text-base font-semibold leading-tight text-white">{label}</p>
                <div className="mt-1.5 text-[0.9375rem] leading-relaxed text-white/70">
                  {render()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
