import { Link } from "react-router-dom";
import NewsletterForm from "./NewsletterForm.jsx";
import ContactStrip from "./ContactStrip.jsx";
import { SHOP_PATH } from "../../data/paths.js";

const COLUMNS = [
  {
    title: "Shop",
    links: [
      // The catalogue grid and its category filters were removed with the
      // listing page, so this column now goes straight to the product.
      { label: "Drain assembly", to: SHOP_PATH },
      { label: "Cart", to: "/cart" },
      { label: "Wishlist", to: "/wishlist" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "FAQs", to: "/faqs" },
      { label: "Contact us", to: "/contact" },
      { label: "Shipping & returns", to: "/faqs#shipping" },
      { label: "Warranty", to: "/faqs#warranty" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About us", to: "/about" },
      { label: "Your account", to: "/account" },
      { label: "Admin", to: "/admin" },
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
            <div className="mt-6 max-w-sm">
              <NewsletterForm />
            </div>
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
