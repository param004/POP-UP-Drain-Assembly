import { forwardRef } from "react";
import { Link } from "react-router-dom";

const STYLES = {
  solid:
    "bg-ink-900 text-shell-100 border border-ink-900 hover:bg-ink-800 hover:border-ink-800",
  outline:
    "bg-transparent text-ink-900 border border-ink-900 hover:bg-ink-900 hover:text-shell-100",
  ghost: "bg-transparent text-ink-900 border border-transparent hover:bg-shell-200",
  light:
    "bg-shell-100 text-ink-900 border border-shell-100 hover:bg-shell-200 hover:border-shell-200",
};

const SIZES = {
  sm: "h-9 px-4 text-[0.6875rem]",
  md: "h-11 px-6 text-xs",
  lg: "h-14 px-9 text-[0.8125rem]",
};

const base =
  "group inline-flex items-center justify-center gap-2 rounded-full font-semibold uppercase tracking-[0.14em] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap";

/** The arrow nudges forward on hover, which is the main affordance in this design. */
function Arrow({ className = "" }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-3.5 w-3.5 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1 ${className}`}
      aria-hidden="true"
    >
      <path d="M2 8h11M9 4l4 4-4 4" />
    </svg>
  );
}

const Button = forwardRef(function Button(
  {
    as,
    to,
    href,
    variant = "outline",
    size = "md",
    withArrow = false,
    className = "",
    children,
    ...props
  },
  ref
) {
  const classes = `${base} ${SIZES[size]} ${STYLES[variant]} ${className}`;
  const content = (
    <>
      <span>{children}</span>
      {withArrow && <Arrow />}
    </>
  );

  if (to) {
    return (
      <Link ref={ref} to={to} className={classes} {...props}>
        {content}
      </Link>
    );
  }
  if (href) {
    return (
      <a ref={ref} href={href} className={classes} {...props}>
        {content}
      </a>
    );
  }

  // `as` lets a caller render a router Link while keeping button semantics.
  const Tag = as || "button";
  return (
    <Tag ref={ref} className={classes} {...props}>
      {content}
    </Tag>
  );
});

export default Button;
export { Arrow };
