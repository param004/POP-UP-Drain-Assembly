import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, Float, AdaptiveDpr } from "@react-three/drei";

import DrainModel from "../three/DrainModel.jsx";
import CameraRig from "../three/CameraRig.jsx";
import StudioEnvironment from "../three/StudioEnvironment.jsx";
import Button from "../ui/Button.jsx";
import Reveal from "../ui/Reveal.jsx";

/**
 * Hero.
 *
 * The left cell is the live 3D product, not a still: it shares DrainModel with
 * the explorer further down the page, so the model that sells the product is the
 * same one the visitor can then take apart. The hero instance is fully assembled
 * and never explodes — that is the explorer's job.
 */
export default function Hero({ product }) {
  const viewRef = useRef({ target: 0, smooth: 0, nodes: null });
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  // The hero canvas is expensive; only run it once it is actually on screen.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "200px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section className="relative min-h-[100svh] overflow-hidden pt-16 sm:pt-[4.5rem]">
      <div className="mx-auto grid min-h-[calc(100svh-4rem)] max-w-[1400px] items-center gap-8 px-5 sm:px-8 lg:grid-cols-2 lg:gap-4">
        {/* ------------------------------- copy ------------------------------- */}
        <div className="relative z-10 order-2 max-w-xl lg:order-1 lg:pb-10">
          <Reveal>
            <p className="eyebrow">introduction</p>
          </Reveal>
          <Reveal delay={0.06}>
            <h1 className="display mt-4 text-[clamp(2.5rem,7vw,4.75rem)]">
              The Ultimate
              <br />
              Drain Solution.
            </h1>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mt-6 max-w-md text-base leading-relaxed text-ink-500 sm:text-lg">
              Seamless operation, durable materials.
            </p>
          </Reveal>
          <Reveal delay={0.18}>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Button to={`/products/${product?.slug ?? "pop-up-drain-assembly"}`} variant="solid" size="lg" withArrow>
                Shop Now
              </Button>
              <a
                href="#explorer"
                className="inline-flex h-14 items-center gap-2 rounded-full px-2 text-[0.8125rem] font-semibold uppercase tracking-[0.14em] text-ink-500 transition-colors hover:text-ink-900"
              >
                Explore in 3D
                <svg
                  viewBox="0 0 16 16"
                  width="14"
                  height="14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M8 2v12M3 9l5 5 5-5" />
                </svg>
              </a>
            </div>
          </Reveal>

          <Reveal delay={0.24}>
            <dl className="mt-14 grid max-w-md grid-cols-3 gap-6 border-t border-shell-300 pt-7">
              {[
                ["4.46", "in / model height"],
                ["M38 × 1.5", "fine thread"],
                ["120 °C", "gasket rating"],
              ].map(([value, label]) => (
                <div key={label}>
                  <dt className="text-lg font-bold tracking-tight sm:text-xl">{value}</dt>
                  <dd className="mt-1 text-[0.6875rem] uppercase tracking-[0.12em] text-ink-400">
                    {label}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        {/* ------------------------------- model ------------------------------- */}
        <div
          ref={ref}
          className="relative order-1 -mx-5 h-[46svh] min-h-[19rem] sm:-mx-8 sm:h-[54svh] lg:order-2 lg:mx-0 lg:h-[78svh]"
        >
          {inView && product?.modelUrl && (
            <Canvas
              shadows
              dpr={[1, 1.75]}
              gl={{ antialias: true, alpha: true }}
              camera={{ fov: 30, near: 0.1, far: 100, position: [4.4, 2.6, 8.6] }}
              style={{ position: "absolute", inset: 0 }}
            >
              <Float
                speed={1.1}
                rotationIntensity={0.05}
                floatIntensity={0.2}
                floatingRange={[-0.03, 0.03]}
              >
                <DrainModel viewRef={viewRef} />
              </Float>

              {/* Reusing the rig means the hero frames the product with exactly
                  the same rules as the explorer, instead of a hand-tuned guess. */}
              <CameraRig viewRef={viewRef} minDistance={5} maxDistance={18} />

              <ambientLight intensity={0.3} />
              <directionalLight position={[4, 7, 5]} intensity={1.5} castShadow />
              <directionalLight position={[-5, 3, -4]} intensity={0.55} color="#cfe0ff" />
              <directionalLight position={[0, 2, -6]} intensity={0.5} color="#fff3e0" />

              <StudioEnvironment />

              {/* The hero never explodes, so a fixed shadow plane is correct here. */}
              <ContactShadows
                position={[0, -1.72, 0]}
                opacity={0.4}
                scale={13}
                blur={2.6}
                far={5}
                resolution={512}
                color="#2a2622"
              />
              <AdaptiveDpr pixelated />
            </Canvas>
          )}

          {/* Caption sits under the render, matching the reference layout. */}
          <p className="pointer-events-none absolute inset-x-0 bottom-1 text-center text-[0.625rem] uppercase tracking-[0.18em] text-ink-400 lg:bottom-8">
            {product?.name ?? "Pop-Up Drain Assembly"}
          </p>
        </div>
      </div>

      {/* Scroll cue */}
      <div className="pointer-events-none absolute inset-x-0 bottom-5 hidden justify-center lg:flex">
        <span className="flex flex-col items-center gap-2 text-ink-400">
          <span className="text-[0.5625rem] uppercase tracking-[0.2em]">Scroll</span>
          <span className="relative block h-8 w-px overflow-hidden bg-shell-300">
            <span className="absolute inset-x-0 top-0 h-3 animate-[cue_2s_ease-in-out_infinite] bg-ink-900" />
          </span>
        </span>
      </div>

      <style>{`@keyframes cue{0%{transform:translateY(-100%)}100%{transform:translateY(300%)}}`}</style>
    </section>
  );
}
