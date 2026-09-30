import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useWishlist } from "../context/WishlistContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import ProductCard from "../components/product/ProductCard.jsx";
import PageHeader from "../components/ui/Page.jsx";
import Button from "../components/ui/Button.jsx";
import Spinner, { EmptyState } from "../components/ui/Feedback.jsx";
import { SHOP_PATH } from "../data/paths.js";

export default function Wishlist() {
  const { items, loading, isAuthenticated, checking } = useWishlist();
  const { isAuthenticated: authed } = useAuth();
  const navigate = useNavigate();
  const [, setTick] = useState(0);

  if (checking) {
    return (
      <div className="grid min-h-[70vh] place-items-center">
        <Spinner label="Checking session" />
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="pt-16 sm:pt-[4.5rem]">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8">
          <EmptyState
            title="Sign in to see your wishlist"
            body="Your wishlist is tied to your account, so it follows you between devices."
            action={
              <Button
                type="button"
                variant="solid"
                size="md"
                withArrow
                onClick={() => navigate("/login", { state: { from: "/wishlist" } })}
              >
                Sign in
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 sm:pt-[4.5rem]">
      <PageHeader
        eyebrow="saved"
        title="Wishlist"
        lede={
          items.length
            ? `${items.length} item${items.length === 1 ? "" : "s"} saved for later.`
            : "Nothing saved yet."
        }
      />

      <div className="mx-auto max-w-[1400px] px-5 py-14 sm:px-8 sm:py-20">
        {loading ? (
          <Spinner label="Loading wishlist" />
        ) : items.length === 0 ? (
          <EmptyState
            title="Your wishlist is empty"
            body="Tap the heart on any product to save it here."
            action={
              <Button to={SHOP_PATH} variant="solid" size="md" withArrow>
                View the product
              </Button>
            }
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((p, i) => (
              // The wishlist projection is a light document; re-render the card
              // when a heart is toggled elsewhere in the tree.
              <ProductCard key={p._id} product={p} index={i} />
            ))}
          </div>
        )}

        <p className="mt-10 text-xs text-ink-400">
          Changed your mind?{" "}
          <Link to={SHOP_PATH} className="underline underline-offset-4">
            Keep browsing
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
