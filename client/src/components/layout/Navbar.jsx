import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import { useCart } from "../../context/CartContext.jsx";
import { useWishlist } from "../../context/WishlistContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { fetchProducts } from "../../api/endpoints.js";
import { SHOP_PATH } from "../../data/paths.js";

const NAV = [
  { label: "Home", to: "/" },
  { label: "Features", to: "/#features" },
  { label: "About Us", to: "/about" },
  // The catalogue page was removed, so this goes straight to the product.
  { label: "Products", to: SHOP_PATH },
  { label: "FAQs", to: "/faqs" },
  { label: "Contact", to: "/contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { count: cartCount } = useCart();
  const { count: wishCount } = useWishlist();
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const searchRef = useRef(null);

  // The header starts transparent over the hero and gains a ground once the page
  // scrolls, which is what keeps the hero image edge-to-edge.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!searchOpen) return;
    searchRef.current?.focus();
  }, [searchOpen]);

  // A drawer that stays open traps the page behind it.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          scrolled || menuOpen
            ? "border-b border-shell-300 bg-shell-100/85 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-6 px-5 sm:h-[4.5rem] sm:px-8">
          <Link
            to="/"
            className="text-lg font-black uppercase tracking-[-0.02em] sm:text-xl"
            aria-label="Premier Products® — home"
          >
            Premier Products<span className="align-super text-[0.5em]">®</span>
          </Link>

          <nav className="ml-6 hidden items-center gap-7 lg:flex" aria-label="Main">
            {NAV.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                className={({ isActive }) =>
                  `relative text-[0.6875rem] font-semibold uppercase tracking-[0.14em] transition-colors ${
                    isActive && item.to === location.pathname
                      ? "text-ink-900"
                      : "text-ink-500 hover:text-ink-900"
                  }`
                }
              >
                {item.label}
                {item.label === "Home" && location.pathname === "/" && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute -bottom-1.5 left-0 h-px w-full bg-ink-900"
                  />
                )}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <IconButton
              label="Search products"
              onClick={() => setSearchOpen((v) => !v)}
              active={searchOpen}
            >
              <SearchIcon />
            </IconButton>

            {isAuthenticated ? (
              <IconButton
                label={`Wishlist, ${wishCount} item${wishCount === 1 ? "" : "s"}`}
                to="/wishlist"
                badge={wishCount}
              >
                <HeartIcon />
              </IconButton>
            ) : (
              <IconButton label="Sign in" to="/login">
                <UserIcon />
              </IconButton>
            )}

            <IconButton
              label={`Cart, ${cartCount} item${cartCount === 1 ? "" : "s"}`}
              to="/cart"
              badge={cartCount}
            >
              <BagIcon />
            </IconButton>

            {/* Account menu, only for signed-in users. */}
            {isAuthenticated && (
              <div className="relative hidden sm:block">
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="ml-1 rounded-full border border-shell-300 px-3 py-1.5 text-[0.625rem] font-semibold uppercase tracking-[0.14em] transition-colors hover:border-ink-900"
                >
                  {user?.name?.split(" ")[0] ?? "Account"}
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              className="ml-1 grid h-9 w-9 place-items-center rounded-full lg:hidden"
            >
              <span className="relative block h-3 w-4">
                <span
                  className={`absolute left-0 block h-px w-full bg-ink-900 transition-all duration-300 ${
                    menuOpen ? "top-1.5 rotate-45" : "top-0"
                  }`}
                />
                <span
                  className={`absolute left-0 top-1.5 block h-px w-full bg-ink-900 transition-opacity duration-200 ${
                    menuOpen ? "opacity-0" : "opacity-100"
                  }`}
                />
                <span
                  className={`absolute left-0 block h-px w-full bg-ink-900 transition-all duration-300 ${
                    menuOpen ? "top-1.5 -rotate-45" : "top-3"
                  }`}
                />
              </span>
            </button>
          </div>
        </div>

        {/* Search drawer */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden border-t border-shell-300 bg-shell-50"
            >
              <SearchPanel inputRef={searchRef} onNavigate={() => setSearchOpen(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile / account drawer */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-40 bg-ink-900/20 backdrop-blur-sm lg:hidden"
              aria-hidden="true"
            />
            <motion.nav
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="fixed right-0 top-0 z-50 flex h-full w-[min(22rem,88vw)] flex-col border-l border-shell-300 bg-shell-50 pt-24 lg:hidden"
              aria-label="Mobile"
            >
              <div className="flex flex-col px-7">
                {NAV.map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.06 * i + 0.1, duration: 0.4 }}
                  >
                    <NavLink
                      to={item.to}
                      onClick={() => setMenuOpen(false)}
                      className={({ isActive }) =>
                        `block border-b border-shell-200 py-4 text-lg font-semibold tracking-tight ${
                          isActive ? "text-ink-900" : "text-ink-500"
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  </motion.div>
                ))}
              </div>

              <div className="mt-auto flex flex-col gap-3 border-t border-shell-200 p-7">
                {isAuthenticated ? (
                  <>
                    <p className="text-sm text-ink-500">
                      Signed in as <span className="font-medium text-ink-900">{user?.email}</span>
                    </p>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="text-sm font-medium underline underline-offset-4"
                      >
                        Admin dashboard
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={async () => {
                        await logout();
                        setMenuOpen(false);
                        navigate("/");
                      }}
                      className="self-start text-sm font-medium underline underline-offset-4"
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMenuOpen(false)}
                      className="text-sm font-semibold uppercase tracking-[0.14em]"
                    >
                      Sign in
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMenuOpen(false)}
                      className="text-sm font-medium text-ink-500 underline underline-offset-4"
                    >
                      Create an account
                    </Link>
                  </>
                )}
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function IconButton({ label, badge, to, active, onClick, children }) {
  const className =
    "relative grid h-9 w-9 place-items-center rounded-full text-ink-700 transition-colors hover:bg-shell-200 hover:text-ink-900";

  const inner = (
    <>
      {children}
      {badge > 0 && (
        <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-ink-900 px-1 text-[0.5625rem] font-bold tabular-nums text-shell-100">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </>
  );

  if (to) {
    return (
      <Link to={to} aria-label={label} className={className}>
        {inner}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-expanded={active}
      className={`${className} ${active ? "bg-shell-200" : ""}`}
    >
      {inner}
    </button>
  );
}

/** Debounced product search backed by the products endpoint. */
function SearchPanel({ inputRef, onNavigate }) {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (term.trim().length < 2) {
      setResults([]);
      return;
    }

    setSearching(true);
    const handle = setTimeout(() => {
      fetchProducts({ search: term.trim(), limit: 5 })
        .then((data) => setResults(data.items))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 250);

    return () => clearTimeout(handle);
  }, [term]);

  return (
    <div className="mx-auto w-full max-w-[1400px] px-5 py-6 sm:px-8">
      <input
        ref={inputRef}
        type="search"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Search drains, gaskets, strainers…"
        aria-label="Search products"
        className="w-full border-b border-shell-300 bg-transparent pb-3 text-lg outline-none placeholder:text-ink-400 focus:border-ink-900"
      />

      <div className="mt-4">
        {searching && <p className="text-sm text-ink-400">Searching…</p>}
        {!searching && term.trim().length >= 2 && results.length === 0 && (
          <p className="text-sm text-ink-400">No products match “{term}”.</p>
        )}
        <ul className="divide-y divide-shell-200">
          {results.map((p) => (
            <li key={p._id}>
              <Link
                to={`/products/${p.slug}`}
                onClick={onNavigate}
                className="flex items-center justify-between gap-4 py-3 transition-colors hover:text-ink-500"
              >
                <span className="text-sm font-medium">{p.name}</span>
                <span className="text-sm tabular-nums text-ink-500">${p.price}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ----------------------------------- icons ---------------------------------- */

const ico = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const SearchIcon = () => (
  <svg {...ico} aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </svg>
);

const HeartIcon = () => (
  <svg {...ico} aria-hidden="true">
    <path d="M12 20s-7-4.4-7-9.2A4.1 4.1 0 0 1 12 8a4.1 4.1 0 0 1 7 2.8C19 15.6 12 20 12 20z" />
  </svg>
);

const BagIcon = () => (
  <svg {...ico} aria-hidden="true">
    <path d="M6 8h12l-1 12H7L6 8z" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" />
  </svg>
);

const UserIcon = () => (
  <svg {...ico} aria-hidden="true">
    <circle cx="12" cy="8.5" r="3.5" />
    <path d="M5 20a7 7 0 0 1 14 0" />
  </svg>
);
