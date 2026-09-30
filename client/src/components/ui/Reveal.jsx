import { motion, useReducedMotion } from "framer-motion";

/**
 * Fade + slide-up on scroll. Falls back to a plain fade when the visitor has
 * asked for reduced motion, and always leaves the content visible if the
 * IntersectionObserver never fires (e.g. JS-disabled printing, odd crawlers).
 */
export default function Reveal({
  children,
  delay = 0,
  y = 24,
  className = "",
  as = "div",
  once = true,
  amount = 0.25,
}) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as] ?? motion.div;

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount }}
      transition={{
        duration: reduce ? 0.2 : 0.75,
        delay: reduce ? 0 : delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </MotionTag>
  );
}
