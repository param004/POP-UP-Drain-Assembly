import Accordion from "../components/ui/Accordion.jsx";
import PageHeader from "../components/ui/Page.jsx";
import Button from "../components/ui/Button.jsx";
import Reveal from "../components/ui/Reveal.jsx";
import { FAQS } from "../data/content.js";

/** The anchored sections of this page. The sidebar jump links render from this. */
const FAQ_SECTIONS = [
  { id: "faq", label: "All questions" },
  { id: "shipping", label: "Ordering & delivery" },
  { id: "warranty", label: "Warranty" },
];

export default function FAQs() {
  return (
    <div className="pt-16 sm:pt-[4.5rem]">
      <PageHeader
        eyebrow="questions"
        title="FAQs"
        lede="The things people ask before they buy. If yours is not here, the contact form composes an email to a person who will answer it."
      />

      <div className="mx-auto max-w-[1400px] px-5 py-14 sm:px-8 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[16rem_1fr] lg:gap-20">
          {/*
            Jump links, which double as the anchors the footer links to. These are
            built from the section ids below rather than written out by hand, so
            the list cannot drift out of sync with the sections it points at.
          */}
          <nav className="lg:sticky lg:top-24 lg:self-start" aria-label="FAQ sections">
            <p className="eyebrow">Jump to</p>
            <ul className="mt-4 space-y-2 text-sm">
              {FAQ_SECTIONS.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="text-ink-500 hover:text-ink-900">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
            <Button to="/contact" variant="outline" size="sm" withArrow className="mt-7">
              Ask a question
            </Button>
          </nav>

          <div id="faq" className="max-w-3xl scroll-mt-24">
            <Reveal>
              <Accordion items={FAQS} defaultOpen={0} allowMultiple />
            </Reveal>

            <section
              id="shipping"
              className="mt-14 scroll-mt-24 rounded-xl border border-shell-300 bg-shell-50 p-8"
            >
              <h2 className="text-lg font-semibold tracking-tight">Ordering</h2>
              <p className="mt-2 max-w-prose text-sm leading-relaxed text-ink-500">
                There is no checkout on this site, so nothing can be ordered through it. Email or
                call us and we will quote you directly, with shipping and fitment advice for your
                basin. Lead times, shipping thresholds and returns windows are not published here
                because they are not settled — see the README for the other placeholder content.
              </p>
            </section>

            <section
              id="warranty"
              className="mt-4 scroll-mt-24 rounded-xl border border-shell-300 bg-shell-50 p-8"
            >
              <h2 className="text-lg font-semibold tracking-tight">Warranty</h2>
              <p className="mt-2 max-w-prose text-sm leading-relaxed text-ink-500">
                The stated cover (five years on the mechanism, two on the finish, one on the
                gasket) is placeholder copy, not a real warranty. Replace it with the actual
                terms, and with the jurisdiction and claim procedure, before publishing.
              </p>
            </section>

            <div className="mt-8 rounded-xl border border-shell-300 bg-shell-50 p-8 text-center">
              <h2 className="text-lg font-semibold tracking-tight">Still not answered?</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm text-ink-500">
                Send us the basin type and the cut-out measurement and we will tell you exactly
                what fits.
              </p>
              <Button to="/contact" variant="solid" size="md" withArrow className="mt-6">
                Contact us
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
