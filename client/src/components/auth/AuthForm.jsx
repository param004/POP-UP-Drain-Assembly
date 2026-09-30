import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext.jsx";
import { Banner, Field, Row } from "../ui/Page.jsx";
import Button from "../ui/Button.jsx";
import Spinner from "../ui/Feedback.jsx";

/**
 * Shared shell for sign-in and registration. Both forms post to the API, and a
 * successful attempt returns the visitor to wherever they came from.
 */
export default function AuthForm({ mode }) {
  const isRegister = mode === "register";
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState(null);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);

  const from = location.state?.from ?? "/";

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((prev) => (prev[k] ? { ...prev, [k]: undefined } : prev));
  };

  const submit = async (e) => {
    e.preventDefault();
    setBanner(null);

    const next = {};
    if (isRegister && !form.name.trim()) next.name = "Required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      next.email = "Enter a valid email address";
    if (form.password.length < 8) next.password = "At least 8 characters";
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      if (isRegister) await register({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      else await login({ email: form.email.trim(), password: form.password });
      navigate(from, { replace: true });
    } catch (err) {
      setBanner({ tone: "error", text: err.message });
      setBusy(false);
    }
  };

  if (checking) {
    return (
      <div className="grid min-h-[70vh] place-items-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="pt-16 sm:pt-[4.5rem]">
      <div className="mx-auto grid max-w-[1400px] gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-2 lg:items-center lg:gap-20">
        {/* ------------------------------- form ------------------------------- */}
        <div className="max-w-md">
          <p className="eyebrow">{isRegister ? "create account" : "welcome back"}</p>
          <h1 className="display mt-3 text-[clamp(1.75rem,4.5vw,2.75rem)]">
            {isRegister ? "Join Premier Products" : "Sign in"}
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-ink-500">
            {isRegister
              ? "Save a wishlist, keep your order history, and carry your cart across devices."
              : "Sign in to see your wishlist and order history."}
          </p>

          {banner && (
            <div className="mt-6">
              <Banner tone={banner.tone}>{banner.text}</Banner>
            </div>
          )}

          <form onSubmit={submit} noValidate className="mt-8 space-y-4">
            {isRegister && (
              <Field
                label="Name"
                name="name"
                autoComplete="name"
                value={form.name}
                onChange={set("name")}
                error={errors.name}
              />
            )}
            <Field
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={set("email")}
              error={errors.email}
            />
            <Field
              label="Password"
              name="password"
              type="password"
              autoComplete={isRegister ? "new-password" : "current-password"}
              value={form.password}
              onChange={set("password")}
              error={errors.password}
              hint={isRegister ? "Minimum 8 characters." : undefined}
            />

            <Button type="submit" variant="solid" size="lg" withArrow className="mt-2 w-full" disabled={busy}>
              {busy ? "Please wait…" : isRegister ? "Create account" : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-sm text-ink-500">
            {isRegister ? "Already have an account? " : "No account yet? "}
            <Link
              to={isRegister ? "/login" : "/register"}
              state={location.state}
              className="font-medium text-ink-900 underline underline-offset-4"
            >
              {isRegister ? "Sign in" : "Create one"}
            </Link>
          </p>

          <p className="mt-8 rounded-lg border border-dashed border-shell-300 px-4 py-3 text-xs leading-relaxed text-ink-400">
            <span className="font-semibold text-ink-500">Demo admin:</span>{" "}
            admin@premierproducts.com / Admin123! — seeded by <code>npm run seed</code>.
          </p>
        </div>

        {/* ------------------------------ aside ------------------------------ */}
        <div className="hidden lg:block">
          <div
            className="aspect-[4/5] rounded-2xl border border-shell-300 bg-[radial-gradient(120%_90%_at_50%_15%,#fbfbfa,#e6e3de)]"
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
}
