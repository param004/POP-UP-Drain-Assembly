/** Marketing copy that does not need to come from the database. */

export const FAQS = [
  {
    q: "Will this fit my sink?",
    a: "The assembly is built for a standard 1-1/2 inch (38 mm) basin cut-out, which is what almost every kitchen sink uses. The threaded shank is M38 × 1.5 fine pitch. If your basin has an unusual cut-out, measure the diameter across the hole before ordering — anything between 36 mm and 42 mm will fit.",
  },
  {
    q: "Do I need a locknut?",
    a: "A locknut is included and is fitted from underneath the basin. Installation is tool-free from above: seat the gasket, drop the flange in, tighten the locknut by hand until it seats, then a quarter turn with a spanner. No silicone and no plumber's tape needed at the flange — the EPDM ring does the sealing.",
  },
  {
    q: "How does the pop-up mechanism work?",
    a: "Pressing the cap pushes the pivot collar down, which rocks it on its pin. That rock lifts the stopper tip clear of the seat, so the drain stays open. Press the cap again and the collar returns, the tip drops back onto the seat and the drain seals. There is no lift rod, no linkage and nothing to adjust — which is why it still works after ten years of daily use.",
  },
  {
    q: "What is it made of?",
    a: "The body, flange, cap and collar are machined from CZ121 brass and plated in chrome. The internals — shaft, pivot pin, rod and tip — are solid brass. The sealing ring is EPDM rubber at 70A Shore, which holds up to 120 °C. Nothing in the wetted path is plastic.",
  },
  {
    q: "Can I use it with hot water?",
    a: "Yes. The EPDM gasket is rated to 120 °C, so dishwasher overflow and boiling water are both fine. Steam is fine too.",
  },
  {
    id: "shipping",
    q: "How do I order?",
    a: "This site is a product showcase and cannot take orders — there is no checkout behind it. To buy, email or call us and we will quote you directly, including shipping and fitment advice for your basin.",
  },
  {
    q: "Is it dishwasher safe?",
    a: "The drain itself is unaffected by a dishwasher, because it stays in the sink. If you are thinking of the replacement gasket set, that is dishwasher safe as well. The only part to keep away from heat is the EPDM seal above 120 °C, which is well beyond any domestic dishwasher.",
  },
  {
    id: "warranty",
    q: "What is the warranty?",
    a: "The intended cover is five years on the mechanism — pivot collar, shaft and cap — against mechanical failure in normal domestic use, with two years on the finish and one on the gaskets. Those numbers are placeholders, not published terms: ask us for the current warranty in writing before ordering.",
  },
  {
    q: "Does the cap get scratched easily?",
    a: "The chrome is a 0.2 micron mirror polish over brass rather than a thin plate over a cheaper alloy, so it wears far better than plated plastic. It will still show fingerprints — that is what a mirror finish does. If that bothers you, the matte black PVD version is fingerprint-resistant by design.",
  },
  {
    q: "Can I replace just the gasket?",
    a: "Yes, and you should. If water is escaping around the outside of the flange rather than through the middle, the gasket has taken a compression set. A replacement ring set is a fraction of the price of a new assembly and takes about two minutes to fit.",
  },
  {
    q: "Is this suitable for a commercial kitchen?",
    a: "The domestic warranty does not extend to commercial use, and the flow rate of 42 L/min is sized for a household sink. For a commercial kitchen you would want a unit rated to the local code. Talk to us and we will point you at the right thing.",
  },
];

export const BRAND_STATS = [
  { value: "5 yr", label: "mechanism warranty" },
  { value: "42 L/min", label: "flow rate" },
  { value: "120 °C", label: "gasket rating" },
  { value: "30 days", label: "returns" },
];

/*
 * Real business contact details, used by the footer contact strip and the
 * contact page so there is a single place to correct them.
 *
 * `phoneDisplay` is what a visitor reads; `phoneDial` is the international
 * format handed to a `tel:` link, so it works from outside India.
 */
export const BUSINESS = {
  addressLines: [
    "Shed No. C2/109, GIDC, Shanker Tekri,",
    "Jamnagar - 361 004, (Guj) India",
  ],
  addressSingle: "Shed No. C2/109, GIDC, Shanker Tekri, Jamnagar - 361 004, (Guj) India",
  phoneDisplay: "9427284945",
  phoneDial: "+919427284945",
  email: "pambhar_k@yahoo.in",
};


export const TIMELINE = [
  {
    year: "2019",
    title: "A leaking flange in a rented flat",
    body: "The original drain in the flat was a chrome-over-plastic unit that had been re-sealed with silicone three times. Re-doing it properly meant understanding why cheap drains fail: the gasket compresses, then the flange rocks, then the seal fails again.",
  },
  {
    year: "2021",
    title: "Drawing the pivot properly",
    body: "Nine months of drawings went into the pivot geometry. The requirement was a single push with a fingertip that would stay open, and a second push that would seal — with no linkage to adjust and nothing to unscrew.",
  },
  {
    year: "2023",
    title: "First production run",
    body: "Two hundred units went out to plumbers and builders. The single most common piece of feedback was that people did not believe the cap would stay open, so the pivot was re-cut to a slightly longer throw.",
  },
  {
    year: "2026",
    title: "The range you are looking at",
    body: "Drain assemblies, a replacement gasket set, strainers and corner adapters. Same brass, same tolerances, same five-year mechanism warranty on everything that moves.",
  },
];
