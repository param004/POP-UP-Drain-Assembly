import PageHeader from "../components/ui/Page.jsx";
import Button from "../components/ui/Button.jsx";
import Reveal from "../components/ui/Reveal.jsx";
import ScrollStory from "../components/home/ScrollStory.jsx";
import { fetchProduct } from "../api/endpoints.js";
import { BRAND_STATS, TIMELINE } from "../data/content.js";
import { SHOP_PATH } from "../data/paths.js";

const PRINCIPLES = [
  {
    title: "Brass, not plated plastic",
    body: "Chrome-over-brass wears through eventually, but it takes decades rather than months. More importantly, the threaded shank does not crack when a spanner is slipped — which is the single most common way a cheap drain dies.",
  },
  {
    title: "Nothing to adjust",
    body: "There is no lift rod, no linkage and no grub screw to back out after five years. The pivot is a machined fit between two parts. That is the whole reason it still works when the alternative does not.",
  },
  {
    title: "Serviceable, not sealed shut",
    body: "Every part in the assembly is a standard component you can replace. The gasket especially — it is the part designed to wear out, and you should be able to swap it without replacing the drain.",
  },
];

export default function About() {
  // Baked in at build time, so this is a lookup rather than a request.
  const product = fetchProduct("pop-up-drain-assembly");

  return (
    <div className="pt-16 sm:pt-[4.5rem]">
      <PageHeader
        eyebrow="about us"
        title="Built around one moving part."
        lede="Premier Products® started because a cheap drain in a rented flat was re-sealed with silicone three times. The fix was not more sealant — it was a drain that does not leak in the first place."
      />

      {/* --------------------------------- stats -------------------------------- */}
      <div className="border-b border-shell-300">
        <div className="mx-auto max-w-[1400px] px-5 py-12 sm:px-8">
          <dl className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {BRAND_STATS.map((s, i) => (
              <Reveal key={s.label} delay={i * 0.06}>
                <dt className="text-2xl font-bold tracking-tight sm:text-3xl">{s.value}</dt>
                <dd className="mt-1.5 text-[0.625rem] uppercase tracking-[0.14em] text-ink-400">
                  {s.label}
                </dd>
              </Reveal>
            ))}
          </dl>
        </div>
      </div>

      {/* --------------------------------- story -------------------------------- */}
      <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 sm:py-28">
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-20">
          <div>
            <h2 className="display text-[clamp(1.5rem,3.5vw,2.5rem)]">How we got here</h2>
            <ol className="mt-10 space-y-9 border-l border-shell-300 pl-7">
              {TIMELINE.map((entry, i) => (
                <Reveal key={entry.year} as="li" delay={i * 0.06}>
                  <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-brass-500">
                    {entry.year}
                  </p>
                  <h3 className="mt-2 text-base font-semibold tracking-tight">{entry.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-500">{entry.body}</p>
                </Reveal>
              ))}
            </ol>
          </div>

          <div className="space-y-8">
            {PRINCIPLES.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.08}>
                <div className="border-t border-shell-300 pt-6">
                  <h3 className="text-base font-semibold tracking-tight">{p.title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-ink-500">{p.body}</p>
                </div>
              </Reveal>
            ))}

            <Reveal delay={0.24}>
              <Button to={SHOP_PATH} variant="solid" size="md" withArrow>
                See the range
              </Button>
            </Reveal>
          </div>
        </div>
      </div>

      {/* ------------------------------- narrative ------------------------------ */}
      {product && (
        <div className="border-t border-shell-300 bg-shell-200/50">
          <div className="mx-auto max-w-[1400px] px-5 pb-10 pt-20 sm:px-8 sm:pb-14 sm:pt-28">
            <Reveal>
              <p className="eyebrow">the mechanism</p>
              <h2 className="display mt-3 max-w-2xl text-[clamp(1.5rem,3.5vw,2.5rem)]">
                One push, and it stays open.
              </h2>
            </Reveal>
          </div>
          {/* Same scroll narrative as the homepage, so the mechanism reads the
              same way wherever the product is introduced. */}
          <ScrollStory
            product={product}
            introLabel="How it comes apart"
            introCaption="Scroll through the assembly, one part at a time — what each piece does, and what it is made of."
          />
        </div>
      )}
    </div>
  );
}
