import { Suspense, lazy, useEffect } from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";

import Navbar from "./components/layout/Navbar.jsx";
import Footer from "./components/layout/Footer.jsx";
import ChatBubble from "./components/layout/ChatBubble.jsx";
import Spinner from "./components/ui/Feedback.jsx";
import ScrollToTop from "./components/layout/ScrollToTop.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { SHOP_PATH } from "./data/paths.js";

// The 3D viewer pulls in three.js, so the routes that use it are code-split and
// the first paint never pays for the renderer.
const Home = lazy(() => import("./pages/Home.jsx"));
const ProductDetail = lazy(() => import("./pages/ProductDetail.jsx"));
const Cart = lazy(() => import("./pages/Cart.jsx"));
const Checkout = lazy(() => import("./pages/Checkout.jsx"));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation.jsx"));
const About = lazy(() => import("./pages/About.jsx"));
const FAQs = lazy(() => import("./pages/FAQs.jsx"));
const Contact = lazy(() => import("./pages/Contact.jsx"));
const Wishlist = lazy(() => import("./pages/Wishlist.jsx"));
const Login = lazy(() => import("./pages/Login.jsx"));
const Register = lazy(() => import("./pages/Register.jsx"));
const Account = lazy(() => import("./pages/Account.jsx"));
const Admin = lazy(() => import("./pages/Admin.jsx"));
const NotFound = lazy(() => import("./pages/NotFound.jsx"));

export default function App() {
  const location = useLocation();

  // Route changes should start at the top, but an in-page anchor (#features)
  // must be left alone or the smooth scroll fights the jump.
  useEffect(() => {
    if (location.hash) return;
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname, location.hash]);

  return (
    <div className="grain flex min-h-screen flex-col">
      <ScrollToTop />
      <Navbar />

      <main className="flex-1">
        <Suspense
          fallback={
            <div className="grid min-h-[70vh] place-items-center">
              <Spinner label="Loading" />
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<Home />} />
            {/*
              The catalogue listing page was removed. Keep /products resolving so
              old bookmarks, shared links and any lingering "?category=" URLs land
              somewhere useful instead of the 404 page. Declared before the
              /products/:slug route so the redirect wins for a bare /products.
            */}
            <Route path="/products" element={<Navigate to={SHOP_PATH} replace />} />
            <Route path="/products/:slug" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order/:orderNumber" element={<OrderConfirmation />} />
            <Route path="/about" element={<About />} />
            <Route path="/faqs" element={<FAQs />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/account" element={<Account />} />
            <Route
              path="/admin"
              element={
                <RequireAdmin>
                  <Admin />
                </RequireAdmin>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>

      <Footer />
      <ChatBubble />
    </div>
  );
}

/** Client-side guard for the admin area. The API enforces the same rule. */
function RequireAdmin({ children }) {
  const { checking, isAdmin } = useAuth();

  if (checking) {
    return (
      <div className="grid min-h-[70vh] place-items-center">
        <Spinner label="Checking access" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto grid min-h-[70vh] max-w-md place-items-center px-5 text-center">
        <div>
          <h1 className="display text-3xl">Admins only</h1>
          <p className="mt-3 text-sm text-ink-500">
            This area is restricted. Sign in with an administrator account to continue.
          </p>
          <Link
            to="/login"
            state={{ from: "/admin" }}
            className="mt-6 inline-flex h-11 items-center rounded-full bg-ink-900 px-6 text-xs font-semibold uppercase tracking-[0.14em] text-shell-100 transition-colors hover:bg-ink-800"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return children;
}
