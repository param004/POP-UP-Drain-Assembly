import { fetchProduct, fetchRelated } from "../api/endpoints.js";
import Hero from "../components/home/Hero.jsx";
import ScrollStory from "../components/home/ScrollStory.jsx";
import FeatureBreakdown from "../components/home/FeatureBreakdown.jsx";
import ProductCard from "../components/product/ProductCard.jsx";
import Reveal from "../components/ui/Reveal.jsx";
import Button from "../components/ui/Button.jsx";
import { SHOP_PATH } from "../data/paths.js";

const SLUG = "pop-up-drain-assembly";

export default function Home() {
  // The catalogue is baked in at build time, so these are plain lookups: no request
  // and no loading or error state, because nothing can be pending and nothing can fail.
  const product = fetchProduct(SLUG);
  const others = fetchRelated(SLUG, 3);

  return (
    <>
      {product && (
        <>
          <Hero product={product} />

          {/* ------------------------- interactive explorer ------------------------ */}
          <section id="explorer" className="border-t border-shell-300">
            {/* The sticky stage below pins itself, so the heading lives outside the
                scroll spacer to avoid being pinned along with the 3D. */}
            <div className="mx-auto max-w-[1400px] px-5 pb-10 pt-20 sm:px-8 sm:pb-14 sm:pt-28">
              <Reveal>
                <p className="eyebrow">explore</p>
                <h2 className="display mt-3 max-w-2xl text-[clamp(1.75rem,4vw,3rem)]">
                  Take it apart.
                </h2>
                <p className="mt-4 max-w-lg text-sm leading-relaxed text-ink-500">
                  Scroll, and we&apos;ll take the assembly apart one part at a time — what each
                  piece does, and what it&apos;s made of.
                </p>
              </Reveal>
            </div>

            <ScrollStory product={product} />
          </section>

          <FeatureBreakdown />

          {/* ------------------------------ related ------------------------------ */}
          {others.length > 0 && (
            <section className="border-t border-shell-300">
              <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 sm:py-28">
                <Reveal>
                  <div className="flex flex-wrap items-end justify-between gap-6">
                    <div>
                      <p className="eyebrow">the rest of the range</p>
                      <h2 className="display mt-3 text-[clamp(1.75rem,4vw,3rem)]">
                        Fits around it.
                      </h2>
                    </div>
                    <Button to={SHOP_PATH} variant="outline" size="md" withArrow>
                      All products
                    </Button>
                  </div>
                </Reveal>

                <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {others.map((p, i) => (
                    <Reveal key={p.slug} delay={i * 0.07}>
                      <ProductCard product={p} />
                    </Reveal>
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </>
  );
}
