import { useState } from "react";

import PageHeader, { Banner, Field } from "../components/ui/Page.jsx";
import Button from "../components/ui/Button.jsx";
import { BRAND_STATS, BUSINESS } from "../data/content.js";

const EMPTY = { name: "", email: "", subject: "", message: "" };

/*
 * The form composes a `mailto:` and hands it to the visitor's own mail client.
 *
 * It used to POST to the contact endpoint and store the message, but there is no
 * server to receive it now. Client-side validation is kept because it still catches
 * the common mistakes before the mail client opens — an empty mailto body is a much
 * worse experience than an inline error.
 *
 * Nothing is sent anywhere: if the visitor's mail client is misconfigured the message
 * simply does not arrive, and the direct email address in the sidebar is the fallback.
 */
export default function Contact() {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((prev) => (prev[k] ? { ...prev, [k]: undefined } : prev));
  };

  const submit = (e) => {
    e.preventDefault();

    const next = {};
    if (!form.name.trim()) next.name = "Required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = "Enter a valid email";
    if (form.message.trim().length < 10) next.message = "Tell us a little more (10+ characters)";
    setErrors(next);
    if (Object.keys(next).length) return;

    const subject = form.subject.trim() || `Enquiry from ${form.name.trim()}`;
    const body = [
      `Name: ${form.name.trim()}`,
      `Email: ${form.email.trim()}`,
      "",
      form.message.trim(),
    ].join("\n");

    const href = `mailto:${BUSINESS.email}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;

    window.location.href = href;
  };

  return (
    <div className="pt-16 sm:pt-[4.5rem]">
      <PageHeader
        eyebrow="contact"
        title="Talk to us."
        lede="Fitment questions, warranty claims, or a specification you need for a drawing — we answer properly, usually within one business day."
      />

      <div className="mx-auto max-w-[1400px] px-5 py-14 sm:px-8 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_20rem] lg:gap-20">
          {/* ------------------------------- form ------------------------------- */}
          <div className="max-w-xl">
            <form onSubmit={submit} noValidate className="space-y-4">
              <Banner tone="info">
                This form opens your own email app with the message pre-filled — nothing is
                stored on the site.
              </Banner>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Name"
                  name="c-name"
                  autoComplete="name"
                  value={form.name}
                  onChange={set("name")}
                  error={errors.name}
                />
                <Field
                  label="Email"
                  name="c-email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={set("email")}
                  error={errors.email}
                />
              </div>

              <Field
                label="Subject (optional)"
                name="c-subject"
                value={form.subject}
                onChange={set("subject")}
              />

              <Field
                as="textarea"
                label="Message"
                name="c-message"
                rows={6}
                value={form.message}
                onChange={set("message")}
                error={errors.message}
                placeholder="Which basin, which cut-out, and what is happening?"
              />

              <Button type="submit" variant="solid" size="lg" withArrow>
                Send message
              </Button>
            </form>
          </div>

          {/* ------------------------------- aside ------------------------------ */}
          <aside className="space-y-8">
            <div>
              <p className="eyebrow">Direct</p>
              <ul className="mt-4 space-y-3 text-sm">
                <li>
                  <span className="block text-ink-400">Email</span>
                  <a href={`mailto:${BUSINESS.email}`} className="underline underline-offset-4">
                    {BUSINESS.email}
                  </a>
                </li>
                <li>
                  <span className="block text-ink-400">Phone</span>
                  <a href={`tel:${BUSINESS.phoneDial}`} className="underline underline-offset-4">
                    {BUSINESS.phoneDisplay}
                  </a>
                </li>
                <li>
                  <span className="block text-ink-400">Address</span>
                  <address className="not-italic text-ink-700">
                    {BUSINESS.addressLines.map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                  </address>
                </li>
                <li>
                  <span className="block text-ink-400">Hours</span>
                  <span className="text-ink-700">Mon–Sat, 9:00–18:00 IST</span>
                </li>
              </ul>
            </div>

            <div className="border-t border-shell-300 pt-6">
              <p className="eyebrow">At a glance</p>
              <dl className="mt-4 grid grid-cols-2 gap-4">
                {BRAND_STATS.map((s) => (
                  <div key={s.label}>
                    <dt className="text-base font-bold tracking-tight">{s.value}</dt>
                    <dd className="mt-0.5 text-[0.625rem] uppercase tracking-[0.12em] text-ink-400">
                      {s.label}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
