import { Link } from "react-router-dom";
import ContactStrip from "./ContactStrip.jsx";
import { SHOP_PATH } from "../../data/paths.js";

const COLUMNS = [
  {
    title: "Shop",
    links: [
      // The catalogue grid and its category filters were removed with the
      // listing page, so this column now goes straight to the product.
      // Cart and wishlist went with the server that backed them.
      { label: "Drain assembly", to: SHOP_PATH },
      { label: "Interactive 3D", to: "/#explorer" },
      { label: "Cross-section view", to: SHOP_PATH },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "FAQs", to: "/faqs" },
      { label: "Contact us", to: "/contact" },
      { label: "Ordering & delivery", to: "/faqs#shipping" },
      { label: "Warranty", to: "/faqs#warranty" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About us", to: "/about" },
      { label: "Product features", to: "/#features" },
      { label: "Request a quote", to: "/contact" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-shell-300 bg-shell-50">
      <ContactStrip />

      <div className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Link
              to="/"
              className="text-2xl font-black uppercase tracking-[-0.02em]"
              aria-label="Premier Products® — home"
            >
              Premier Products<span className="align-super text-[0.5em]">®</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-500">
              Brass-bodied, chrome-finished drain hardware. One pivot, no linkage, nothing to
              adjust.
            </p>
            {/*
              The newsletter signup was removed along with the other capture forms.
              It validated the address and confirmed locally while storing nothing,
              which told visitors their email had been saved when it had not. The
              contact strip above is the one path to reach the business, and it works.
            */}
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="eyebrow">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-ink-500 transition-colors hover:text-ink-900"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-shell-300 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-400">
            © {new Date().getFullYear()} Premier Products®. All rights reserved.
          </p>
          <p className="text-xs text-ink-400">
            Product names and specifications shown are illustrative placeholders.
          </p>
        </div>
      </div>
    </footer>
  );
}
