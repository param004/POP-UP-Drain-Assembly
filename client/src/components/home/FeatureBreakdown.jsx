import Reveal from "../ui/Reveal.jsx";

/**
 * The three-column breakdown from the reference: Introduction, Pop-Up Design and
 * Pivot Collar. Copy is deliberately plain — this section exists to explain the
 * mechanism, not to sell.
 */
const FEATURES = [
  {
    title: "Introduction",
    body: "The drain body moves up or down. The pivot collar and the stopper tip move up or down. The pivot shaft tilts. The cap is a quarter turn. An easy click means the drain is open or closed — no more guessing which way to pull the plug to let the water go.",
  },
  {
    title: "Pop-Up Design",
    body: "Pressing the stopper cap moves the pivot collar and the stopper tip up or down. It is the nut that the stopper tip rests on, so the seal closes as firmly as the drain is open. No linkage to adjust, and nothing to go out of alignment.",
  },
  {
    title: "Pivot Collar",
    body: "Pressing the stopper cap moves the pivot collar and the stopper up or down to drop the water. The hinge pivots and telescopes at the same time, which is what makes the whole motion a single clean push rather than a two-handed lift.",
  },
];

export default function FeatureBreakdown() {
  return (
    <section id="features" className="border-t border-shell-300 bg-shell-200/60">
      <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 sm:py-28">
        <div className="grid gap-12 lg:grid-cols-3 lg:gap-16">
          {FEATURES.map((feature, i) => (
            <Reveal key={feature.title} delay={i * 0.08}>
              <div className="flex h-full flex-col">
                <span className="text-[0.6875rem] font-semibold tabular-nums text-ink-400">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="display mt-4 text-xl sm:text-2xl">{feature.title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-ink-500">{feature.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
