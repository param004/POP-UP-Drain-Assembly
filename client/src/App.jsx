import { Suspense, lazy, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import Navbar from "./components/layout/Navbar.jsx";
import Footer from "./components/layout/Footer.jsx";
import ChatBubble from "./components/layout/ChatBubble.jsx";
import Spinner from "./components/ui/Feedback.jsx";
import ScrollToTop from "./components/layout/ScrollToTop.jsx";
import { SHOP_PATH } from "./data/paths.js";

// The 3D viewer pulls in three.js, so the routes that use it are code-split and
// the first paint never pays for the renderer.
const Home = lazy(() => import("./pages/Home.jsx"));
const ProductDetail = lazy(() => import("./pages/ProductDetail.jsx"));
const About = lazy(() => import("./pages/About.jsx"));
const FAQs = lazy(() => import("./pages/FAQs.jsx"));
const Contact = lazy(() => import("./pages/Contact.jsx"));
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
            <Route path="/about" element={<About />} />
            <Route path="/faqs" element={<FAQs />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>

      <Footer />
      <ChatBubble />
    </div>
  );
}
