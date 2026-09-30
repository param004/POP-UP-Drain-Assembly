import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { submitContact } from "../api/endpoints.js";
import PageHeader, { Banner, Field } from "../components/ui/Page.jsx";
import Button from "../components/ui/Button.jsx";
import { BRAND_STATS, BUSINESS } from "../data/content.js";

const EMPTY = { name: "", email: "", subject: "", message: "" };

export default function Contact() {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((prev) => (prev[k] ? { ...prev, [k]: undefined } : prev));
  };

  const send = useMutation({
    mutationFn: submitContact,
    onSuccess: () => {
      setSent(true);
      setForm(EMPTY);
    },
  });

  const submit = (e) => {
    e.preventDefault();
    const next = {};
    if (!form.name.trim()) next.name = "Required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = "Enter a valid email";
    if (form.message.trim().length < 10) next.message = "Tell us a little more (10+ characters)";
    setErrors(next);
    if (Object.keys(next).length) return;
    send.mutate(form);
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
            {sent ? (
              <div className="rounded-xl border border-shell-300 bg-shell-50 p-8">
                <h2 className="text-lg font-semibold tracking-tight">Message received.</h2>
                <p className="mt-3 text-sm leading-relaxed text-ink-500">
                  Thanks for getting in touch. A specialist will reply to the address you gave us,
                  normally within one business day.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-6"
                  onClick={() => setSent(false)}
                >
                  Send another
                </Button>
              </div>
            ) : (
              <form onSubmit={submit} noValidate className="space-y-4">
                {send.isError && <Banner tone="error">{send.error.message}</Banner>}

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

                <Button
                  type="submit"
                  variant="solid"
                  size="lg"
                  withArrow
                  disabled={send.isPending}
                >
                  {send.isPending ? "Sending…" : "Send message"}
                </Button>
              </form>
            )}
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
