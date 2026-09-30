import Accordion from "../components/ui/Accordion.jsx";
import PageHeader from "../components/ui/Page.jsx";
import Button from "../components/ui/Button.jsx";
import Reveal from "../components/ui/Reveal.jsx";
import { FAQS } from "../data/content.js";

export default function FAQs() {
  return (
    <div className="pt-16 sm:pt-[4.5rem]">
      <PageHeader
        eyebrow="questions"
        title="FAQs"
        lede="The things people ask before they buy. If yours is not here, the contact form goes to a person who will answer it."
      />

      <div className="mx-auto max-w-[1400px] px-5 py-14 sm:px-8 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[16rem_1fr] lg:gap-20">
          {/* Jump links, which double as the anchors the footer links to. */}
          <nav className="lg:sticky lg:top-24 lg:self-start" aria-label="FAQ sections">
            <p className="eyebrow">Jump to</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a href="#faq" className="text-ink-500 hover:text-ink-900">
                  All questions
                </a>
              </li>
              <li>
                <a href="#shipping" className="text-ink-500 hover:text-ink-900">
                  Shipping &amp; returns
                </a>
              </li>
              <li>
                <a href="#warranty" className="text-ink-500 hover:text-ink-900">
                  Warranty
                </a>
              </li>
            </ul>
            <Button to="/contact" variant="outline" size="sm" withArrow className="mt-7">
              Ask a question
            </Button>
          </nav>

          <div id="faq" className="max-w-3xl scroll-mt-24">
            <Reveal>
              <Accordion items={FAQS} defaultOpen={0} allowMultiple />
            </Reveal>

            <div className="mt-14 rounded-xl border border-shell-300 bg-shell-50 p-8 text-center">
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
