/**
 * The explode slider.
 *
 * Rendered as a vertical track on desktop and a horizontal track on mobile, per
 * the brief. A native range input is used for the drag behaviour (it is
 * keyboard accessible and works with touch for free) and the visible rail and
 * fill are painted on top of it, so the control looks designed but behaves like
 * a real input.
 */
export default function ExplodeSlider({ value, onChange, orientation = "vertical", label = "Explode" }) {
  const isVertical = orientation === "vertical";
  const pct = Math.round(value * 100);

  return (
    <div
      className={`flex items-center gap-3 ${
        isVertical ? "h-full flex-col" : "w-full flex-row"
      }`}
    >
      {isVertical && (
        <span className="eyebrow [writing-mode:vertical-rl] rotate-180">Explode</span>
      )}

      <div
        className={`relative ${
          isVertical ? "h-full w-8" : "h-8 w-full"
        }`}
      >
        {/* Rail */}
        <div
          aria-hidden="true"
          className={`absolute bg-shell-300 ${
            isVertical ? "left-1/2 top-0 h-full w-px -translate-x-1/2" : "left-0 top-1/2 h-px w-full -translate-y-1/2"
          }`}
        />

        {/* Fill */}
        <div
          aria-hidden="true"
          className={`absolute bg-ink-900 transition-none ${
            isVertical
              ? "left-1/2 top-0 w-px -translate-x-1/2"
              : "left-0 top-1/2 h-px -translate-y-1/2"
          }`}
          style={
            isVertical
              ? { height: `${pct}%` }
              : { width: `${pct}%` }
          }
        />

        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={pct}
          onChange={(e) => onChange(Number(e.target.value) / 100)}
          aria-label={`${label} amount`}
          aria-valuetext={`${pct} percent`}
          className={`absolute cursor-pointer appearance-none bg-transparent
            [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-ink-900
            [&::-webkit-slider-thumb]:bg-shell-100
            [&::-webkit-slider-thumb]:shadow-[0_2px_8px_rgba(17,17,17,0.25)]
            [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5
            [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-ink-900 [&::-moz-range-thumb]:bg-shell-100
            focus-visible:outline-none
            ${
              isVertical
                ? "left-1/2 top-0 h-full w-8 -translate-x-1/2 [writing-mode:vertical-lr] [direction:rtl]"
                : "left-0 top-1/2 w-full h-8 -translate-y-1/2"
            }`}
        />

        {/* Tick marks at the quartile steps of the explode range. */}
        {[0, 25, 50, 75, 100].map((t) => (
          <span
            key={t}
            aria-hidden="true"
            className={`absolute bg-ink-400 ${
              isVertical
                ? "left-1/2 h-px w-1.5 -translate-x-1/2"
                : "top-1/2 h-1.5 w-px -translate-y-1/2"
            }`}
            style={isVertical ? { top: `${t}%` } : { left: `${t}%` }}
          />
        ))}
      </div>

      {/* Live percentage readout */}
      <div
        className={`flex items-baseline gap-0.5 tabular-nums ${
          isVertical ? "flex-row" : "flex-row"
        }`}
      >
        <span className="text-sm font-semibold">{pct}</span>
        <span className="text-[0.625rem] text-ink-500">%</span>
      </div>
    </div>
  );
}
