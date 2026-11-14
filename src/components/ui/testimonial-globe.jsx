"use client";

/* =====================================================================
   TestimonialGlobe
   ---------------------------------------------------------------------
   WHAT IT DOES
   - Shows a 3D rotating globe (made with the "cobe" library).
   - Every review is a small round photo ("pin") stuck on the globe at
     the reviewer's city (lat / lng).
   - Next to the globe is ONE review card. Hover / click a pin, drag the
     globe, or use the arrow buttons to change which review is shown.

   HOW THE FILE IS ORGANISED (search for the "SECTION" markers)
   1. Imports
   2. Constants          - numbers you can tweak
   3. Small helper fns   - math + colour helpers
   4. Custom hooks       - theme change + screen pixel ratio
   5. Small UI pieces    - icons, Portrait, QuoteCard, Pin
   6. Main component     - TestimonialGlobe (state, effects, layout)
   ===================================================================== */

/* ---------------------------------------------------------------------
   SECTION 1: IMPORTS
   --------------------------------------------------------------------- */
import * as React from "react";
// flushSync forces React to update the screen immediately (used on pin hover
// so the card changes instantly, with no waiting).
import { flushSync } from "react-dom";
// cobe = tiny WebGL library that draws the globe on a <canvas>.
import createGlobe from "cobe";

/* ---------------------------------------------------------------------
   SECTION 2: CONSTANTS  (safe numbers to tweak)
   --------------------------------------------------------------------- */
const GLOBE_RADIUS = 0.8; // size of the sphere inside the canvas (cobe's own scale)
const THETA = 0.3; // vertical tilt of the globe (radians)
const PIN_ALTITUDE = 0.05; // how far pins float above the globe surface
const DRAG_FRICTION = 0.92; // after a drag-flick, globe slows by this each frame (closer to 1 = slides longer)
const RELEASE_GRACE_MS = 80; // if you stop moving this long before letting go, no flick momentum
const TEXTURE_RETRY_MS = [150, 600, 1500]; // re-draw globe a few times because the map texture loads late
const TURN_MS = 1200; // time the globe takes to rotate to a chosen pin
const HOLD_MS = 7000; // a clicked ("pinned") review stays locked for this long
const DRAG_SLOP = 6; // finger/mouse must move this many px before it counts as a drag (not a click)
const SWIPE_MIN = 40; // swipe distance (px) on the card needed to change review on touch screens
const WIDE_MIN = 620; // (kept from original) wide-layout breakpoint idea
const FRONT_MARGIN = 0.06; // a pin must be this much "more in front" before it takes over as the active one
const MAX_CONTENT = 1400; // max content width (px). Raised from 1200 so the card is wider and the city/country fits.

// --- Card sizing (the fix for "card changes height") ---
const CARD_HEIGHT = 300; // the card is ALWAYS this tall (px). Raise it if you want more room.
const QUOTE_LINES = 3; // quote shows this many lines, then "See more" appears

// Text for screen readers / buttons. Can be overridden with the `labels` prop.
const DEFAULT_LABELS = {
  previous: "Previous review",
  next: "Next review",
  pin: "Show the review from",
};

// Colour of the ring around each photo. Picked by "tone" (1-5).
const RING = {
  1: "ring-emerald-500",
  2: "ring-teal-500",
  3: "ring-amber-500",
  4: "ring-blue-500",
  5: "ring-emerald-600",
};

// Colour of the pulsing "ping" circle behind each pin. Same 1-5 tones.
const PING = {
  1: "border-emerald-500",
  2: "border-teal-500",
  3: "border-amber-500",
  4: "border-blue-500",
  5: "border-emerald-600",
};

/* ---------------------------------------------------------------------
   SECTION 3: SMALL HELPER FUNCTIONS
   --------------------------------------------------------------------- */

// Join CSS class names, skipping false/empty ones.  cx("a", false, "b") -> "a b"
function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

// Force a number to stay between 0 and 1.
const clamp01 = (value) => Math.min(1, Math.max(0, value));

// "Smoothstep": turns a straight 0->1 change into a gentle S-curve.
const smooth = (t) => t * t * (3 - 2 * t);

// Every review gets a colour tone 1-5. Use item.tone if given, else cycle by position.
function toneOf(item, index) {
  return item.tone ?? ((index % 5) + 1);
}

// Convert a city's latitude/longitude into a 3D point [x, y, z] on a unit sphere.
function toCartesian(lat, lng) {
  const la = (lat * Math.PI) / 180;
  const lo = (lng * Math.PI) / 180 - Math.PI;
  const c = Math.cos(la);
  return [-c * Math.cos(lo), Math.sin(la), c * Math.sin(lo)];
}

// Take a 3D point on the globe + the current rotation (phi, theta) and work out:
//   x, y   -> where to draw the pin on screen (0..1 inside the globe box)
//   depth  -> >0 means the pin faces us, <0 means it is on the back side
//   rim    -> how far past the edge of the sphere the pin is
function project([x, y, z], phi, theta, altitude) {
  const cp = Math.cos(phi);
  const sp = Math.sin(phi);
  const ct = Math.cos(theta);
  const st = Math.sin(theta);
  const radius = GLOBE_RADIUS * (1 + altitude);
  const sx = (cp * x + sp * z) * radius;
  const sy = (sp * st * x + ct * y - cp * st * z) * radius;
  const depth = -sp * ct * x + st * y + cp * ct * z;
  return { x: (sx + 1) / 2, y: (1 - sy) / 2, depth, rim: Math.hypot(sx, sy) - GLOBE_RADIUS };
}

// The globe rotation (phi) needed so a given longitude faces the viewer.
function facingPhi(lng) {
  return (3 * Math.PI) / 2 - (lng * Math.PI) / 180;
}

// Globe angles repeat every 360deg. Pick the equivalent angle closest to where
// we are now, so the globe takes the SHORT way round instead of spinning far.
function nearestTurn(from, angle) {
  const tau = Math.PI * 2;
  return angle + tau * Math.round((from - angle) / tau);
}

// How see-through a pin is. Front = clear, back = faded / hidden.
function pinOpacity(depth, rim) {
  if (depth >= 0) return 0.45 + 0.55 * smooth(clamp01(depth / 0.3));
  const exposed = Math.max(clamp01(rim / 0.04), clamp01(1 + depth * 8));
  return 0.45 * exposed * clamp01(1 + depth * 3);
}

// Pins shrink a bit as they turn toward the back (gives a 3D feel).
function pinScale(depth) {
  return 0.62 + 0.38 * smooth(clamp01((depth + 0.2) / 0.7));
}

// Animation curve: starts fast, ends slow. Used when the globe turns to a pin.
function easeOutExpo(t) {
  return t >= 1 ? 1 : (1 - Math.pow(2, -10 * t)) / (1 - Math.pow(2, -10));
}

// --- Colour helpers (kept from the original; not used by the white globe) ---
let colorCanvas = null;

// Turns any CSS colour (even a CSS variable) into [r, g, b] numbers 0..1.
function resolveColor(scope, candidates) {
  const holder = document.createElement("span");
  holder.style.cssText = "display:none;color:transparent";
  const probe = document.createElement("span");
  holder.appendChild(probe);
  scope.appendChild(holder);
  const unresolved = getComputedStyle(holder).color;
  let computed = null;
  for (const candidate of candidates) {
    probe.style.color = "";
    probe.style.color = candidate;
    const value = probe.style.color ? getComputedStyle(probe).color : unresolved;
    if (value !== unresolved) {
      computed = value;
      break;
    }
  }
  holder.remove();
  if (!computed) return null;
  colorCanvas = colorCanvas || document.createElement("canvas");
  colorCanvas.width = colorCanvas.height = 1;
  const ctx = colorCanvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillStyle = computed;
  ctx.fillRect(0, 0, 1, 1);
  const [r = 0, g = 0, b = 0, a = 0] = ctx.getImageData(0, 0, 1, 1).data;
  return a === 0 ? null : [r / 255, g / 255, b / 255];
}

// Build a list of CSS variable names to try for a theme token.
const themeToken = (name) => [`var(--${name})`, `var(--color-${name})`];

// Blend two colours. t=0 -> a, t=1 -> b.
function mix(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

// How bright a colour is (0 = black, 1 = white).
function luminance([r, g, b]) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/* ---------------------------------------------------------------------
   SECTION 4: CUSTOM HOOKS
   --------------------------------------------------------------------- */

// Re-renders the component whenever the site theme changes (light <-> dark),
// so the globe colours can be refreshed.
function useThemeTick() {
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    const bump = () => setTick((t) => t + 1);
    // Watch <html> and <body> for class / style / data-theme changes.
    const observer = new MutationObserver(bump);
    for (const el of [document.documentElement, document.body]) {
      observer.observe(el, { attributes: true, attributeFilter: ["class", "style", "data-theme", "data-mode"] });
    }
    // Also watch the operating-system dark-mode setting.
    const scheme = window.matchMedia("(prefers-color-scheme: dark)");
    scheme.addEventListener("change", bump);
    return () => {
      observer.disconnect();
      scheme.removeEventListener("change", bump);
    };
  }, []);
  return tick;
}

// Returns the screen's pixel ratio (1 on normal screens, 2 on retina), capped at 2
// so the globe stays sharp but does not use too much GPU.
// Updates if the user drags the window to another monitor.
function useDevicePixelRatio() {
  const [dpr, setDpr] = React.useState(() =>
    typeof window === "undefined" ? 1 : Math.min(window.devicePixelRatio || 1, 2)
  );
  React.useEffect(() => {
    let query = null;
    const watch = () => {
      query?.removeEventListener("change", watch);
      setDpr(Math.min(window.devicePixelRatio || 1, 2));
      query = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      query.addEventListener("change", watch);
    };
    watch();
    return () => query?.removeEventListener("change", watch);
  }, []);
  return dpr;
}

// (Kept from the original, currently unused) makes the same "random" star
// positions every time, so server and browser output match.
function seededStars(count) {
  let seed = 11;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  const stars = [];
  while (stars.length < count) {
    const x = 0.02 + rand() * 0.96;
    const y = 0.02 + rand() * 0.96;
    if (Math.hypot(x - 0.5, y - 0.5) < 0.44) continue; // keep stars away from the globe centre
    stars.push({
      id: stars.length,
      left: x * 100,
      top: y * 100,
      size: rand() < 0.75 ? 1 : 2,
      delay: rand() * 4,
      duration: 2.5 + rand() * 3,
    });
  }
  return stars;
}

const STARS = seededStars(36);

/* ---------------------------------------------------------------------
   SECTION 5: SMALL UI PIECES
   --------------------------------------------------------------------- */

// The 10 corner points of a 5-point star, used by <StarIcon>.
const STAR_POINTS = Array.from({ length: 10 }, (_, k) => {
  const r = k % 2 ? 4.1 : 9.4; // alternate between inner and outer radius
  const a = (k * Math.PI) / 5 - Math.PI / 2;
  return `${(10 + r * Math.cos(a)).toFixed(2)},${(10.6 + r * Math.sin(a)).toFixed(2)}`;
}).join(" ");

// One rating star. Colour comes from the parent's text colour (currentColor).
function StarIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={className}>
      <polygon points={STAR_POINTS} fill="currentColor" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

// The big decorative quotation mark (") at the top-left of the card.
function QuoteMark({ className }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M9.6 5.5C6.4 6.5 4.4 9.3 4.4 12.9v5.6h6.2v-6.2H7.7c.2-2 1.4-3.6 3.2-4.3L9.6 5.5Zm9.4 0c-3.2 1-5.2 3.8-5.2 7.4v5.6H20v-6.2h-2.9c.2-2 1.4-3.6 3.2-4.3L19 5.5Z" />
    </svg>
  );
}

// Left / right arrow used in the previous / next buttons.
function Chevron({ direction }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      style={{ width: "16px", height: "16px" }}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={direction === "left" ? "M10 3.5 5.5 8l4.5 4.5" : "M6 3.5 10.5 8 6 12.5"} />
    </svg>
  );
}

// Round profile photo. If the image fails to load, shows a grey person icon instead.
function Portrait({ src, className }) {
  const [failed, setFailed] = React.useState(false);
  const [shownSrc, setShownSrc] = React.useState(src);
  // If the image URL changes, forget the old "failed" state and try again.
  if (shownSrc !== src) {
    setShownSrc(src);
    setFailed(false);
  }
  if (failed) {
    return (
      <span className={cx("grid place-items-center bg-gray-100 text-gray-400", className)}>
        <svg viewBox="0 0 24 24" aria-hidden="true" className="w-3/5 h-3/5" fill="currentColor">
          <circle cx="12" cy="8.5" r="4" />
          <path d="M4.5 21c.8-4.1 3.8-6.4 7.5-6.4s6.7 2.3 7.5 6.4Z" />
        </svg>
      </span>
    );
  }
  return (
    <img
      src={src}
      alt=""
      draggable={false}
      decoding="async"
      className={cx("object-cover", className)}
      onError={() => setFailed(true)}
    />
  );
}

/* ---------------------------------------------------------------------
   QuoteCard  -  the review card
   ---------------------------------------------------------------------
   KEY BEHAVIOUR:
   - Always the SAME height (CARD_HEIGHT). It never grows or shrinks.
   - Long review text is cut after QUOTE_LINES lines.
   - If it was cut, a "See more" button appears. Click it to read the rest
     (it scrolls inside the card). Click "See less" to fold it back.
   - No fade / slide animation when the review changes.
   --------------------------------------------------------------------- */
const QuoteCard = React.memo(function QuoteCard({ item, index, tone, roomy }) {
  // Rating: clamp to a whole number 0-5, or null if the review has no rating.
  const rating = item.rating === undefined ? null : Math.max(0, Math.min(5, Math.round(item.rating)));
  // "Role, Company" line under the name.
  const meta = [item.role, item.company].filter(Boolean).join(", ");

  // expanded    -> is the full text open?
  // overflowing -> is the text too long for 3 lines? (decides if "See more" shows)
  const [expanded, setExpanded] = React.useState(false);
  const [overflowing, setOverflowing] = React.useState(false);
  const textRef = React.useRef(null); // points at the <p> holding the quote

  // Measure whether the quote is being cut off.
  // scrollHeight = full text height, clientHeight = visible height.
  // If full > visible, the text is clipped, so we need "See more".
  // ResizeObserver re-checks when the card width changes (window resize).
  React.useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return;
    const check = () => {
      if (!expanded) setOverflowing(el.scrollHeight > el.clientHeight + 1);
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [item.quote, expanded]);

  return (
    <figure
      data-quote-card=""
      data-index={index}
      style={{
        // Card colours come from your CSS variables, with safe fallbacks.
        background: "var(--bg-card, #ffffff)",
        color: "var(--text-primary, #0b241c)",
        borderColor: "var(--border-subtle, #d6e2db)",
        boxShadow: "var(--card-shadow, 0 10px 30px -4px rgba(15, 56, 44, 0.08))",
        width: "100%",
        height: CARD_HEIGHT, // <-- FIXED HEIGHT. This is what stops the size jumping.
        boxSizing: "border-box",
        overflow: "hidden", // anything extra is hidden, never stretches the card
      }}
      className={cx(
        // NOTE: no "transition-*" class here on purpose -> no animation.
        "relative m-0 flex min-w-0 w-full flex-col rounded-[26px] border",
        roomy ? "px-9 pt-7 pb-8" : "px-7 pt-6 pb-7"
      )}
    >
      {/* ---- PART 1: top row = quote icon + stars ----
          "pr-36" leaves empty space on the right so the stars never slide
          under the previous / next buttons. shrink-0 = never squashed. */}
      <div className={cx("relative flex shrink-0 items-center gap-3", roomy ? "min-h-7 pr-36" : "min-h-6 pr-32")}>
        <QuoteMark className={cx("shrink-0 text-emerald-600/30", roomy ? "w-8 h-8" : "w-6 h-6")} />
        {rating !== null && (
          <span role="img" aria-label={`Rated ${rating} out of 5`} className="flex items-center gap-0.5">
            {[0, 1, 2, 3, 4].map((k) => (
              <StarIcon
                key={k}
                // filled gold for earned stars, grey for the rest
                className={cx("w-4 h-4", k < rating ? "text-amber-500 fill-amber-500" : "text-gray-300")}
              />
            ))}
          </span>
        )}
      </div>

      {/* ---- PART 2: the review text ----
          flex-1 + min-h-0 = takes ALL leftover space in the card but never pushes it taller.
          Collapsed -> overflow-hidden (extra lines hidden).
          Expanded  -> overflow-y-auto (scrolls inside the card). */}
      <div className={cx("min-h-0 flex-1", expanded ? "overflow-y-auto" : "overflow-hidden", roomy ? "mt-4" : "mt-2.5")}>
        <blockquote className={cx("m-0 text-pretty", roomy ? "text-[17px]" : "text-[15px]")}>
          <p
            ref={textRef}
            style={{
              color: "var(--text-primary, #0b241c)",
              fontWeight: 500,
              margin: 0,
              lineHeight: 1.65,
              // When NOT expanded, clamp to QUOTE_LINES lines (the "...") using the
              // -webkit-line-clamp trick. When expanded, no limit.
              ...(expanded
                ? {}
                : {
                    display: "-webkit-box",
                    WebkitBoxOrient: "vertical",
                    WebkitLineClamp: QUOTE_LINES,
                    overflow: "hidden",
                  }),
            }}
          >
            {item.quote}
          </p>
        </blockquote>

        {/* "See more / See less" - only when the text is actually long */}
        {(overflowing || expanded) && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="mt-1 cursor-pointer border-0 bg-transparent p-0 text-sm font-semibold text-emerald-600 hover:underline"
          >
            {expanded ? "See less" : "See more"}
          </button>
        )}
      </div>

      {/* ---- PART 3: bottom row = photo + name/role + city/country ---- */}
      <figcaption className={cx("relative mt-3 flex w-full min-w-0 shrink-0 items-center gap-3")}>
        {/* Round photo with a coloured ring */}
        <span
          className={cx(
            "relative block shrink-0 rounded-full ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900",
            RING[tone] || "ring-emerald-500",
            roomy ? "w-12 h-12" : "w-10 h-10"
          )}
          style={{ flexShrink: 0 }}
        >
          <Portrait src={item.image} className="w-full h-full rounded-full" />
        </span>

        {/* Name + "Role, Company". flex-1 + min-w-0 + truncate = long text gets "..." */}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-base font-bold" style={{ color: "var(--text-primary, #0b241c)" }}>
            {item.name}
          </span>
          {meta && (
            <span className="block truncate text-xs font-medium" style={{ color: "var(--text-secondary, #3d564d)" }}>
              {meta}
            </span>
          )}
        </span>

        {/* City + country on the right.
            ml-auto pushes it to the far right, shrink-0 + nowrap means it is
            NEVER cut off, pl-3 keeps a gap from the name. */}
        <span
          className="ml-auto shrink-0 pl-3 text-right text-xs leading-tight font-medium"
          style={{ color: "var(--text-muted, #6e847c)", whiteSpace: "nowrap" }}
        >
          <span className="block font-semibold">{item.city}</span>
          {item.country && (
            <span className="mt-0.5 block font-mono text-[11px] uppercase tracking-wider">{item.country}</span>
          )}
        </span>
      </figcaption>
    </figure>
  );
});

/* ---------------------------------------------------------------------
   Pin  -  one round photo button that sits on the globe
   ---------------------------------------------------------------------
   Its position / opacity / size are NOT set by React. They are written
   directly to the DOM by the `place()` function in the main component
   every animation frame (much faster than re-rendering React 60x/second).
   --------------------------------------------------------------------- */
const Pin = React.memo(function Pin({
  item,
  index,
  tone,
  size,
  label,
  featured, // is this the currently shown review?
  approaching, // is the globe currently turning toward this pin (autoplay)?
  pressed, // was it clicked and locked?
  tabbable, // can the Tab key land on it? (only one pin at a time)
  register, // gives the parent a handle to this DOM element
  onEnter,
  onLeave,
  onPress,
  onKey,
  onFocusPin,
}) {
  return (
    <button
      ref={(el) => register(index, el)}
      type="button"
      data-pin={index}
      data-featured={featured ? "" : undefined}
      data-target={approaching ? "" : undefined}
      tabIndex={tabbable ? 0 : -1}
      aria-label={label}
      aria-current={featured ? "true" : undefined}
      aria-pressed={pressed}
      // opacity-0 at first; place() fades the pin in once it knows where it is.
      className="group/pin absolute left-0 top-0 rounded-full opacity-0 outline-none will-change-transform"
      style={{ width: size, height: size }}
      onPointerEnter={(event) => onEnter(index, event)}
      onPointerLeave={(event) => onLeave(index, event)}
      onClick={() => onPress(index)}
      onKeyDown={(event) => onKey(index, event)}
      onFocus={(event) => onFocusPin(index, event.currentTarget)}
    >
      {/* Pulsing ring behind the photo (hidden if user prefers reduced motion) */}
      <span
        aria-hidden="true"
        data-ping
        className={cx(
          "pointer-events-none absolute inset-0 rounded-full border-2 animate-ping [animation-duration:3s] motion-reduce:hidden",
          PING[tone] || "border-emerald-500",
          featured || approaching ? "opacity-80" : "opacity-25" // active pin pulses stronger
        )}
        style={{ animationDelay: `${(index % 5) * 0.6}s` }} // stagger so pins do not pulse together
      />
      {/* The photo itself. Active pin is 35% bigger with a thicker ring. */}
      <span
        data-pin-face
        className={cx(
          "relative block w-full h-full overflow-hidden rounded-full bg-white shadow-md ring-offset-2 ring-offset-white dark:ring-offset-gray-900 transition-[scale,box-shadow] duration-200 ease-out motion-reduce:transition-none",
          "group-focus-visible/pin:outline-2 group-focus-visible/pin:outline-offset-[5px] group-focus-visible/pin:outline-emerald-600",
          RING[tone] || "ring-emerald-500",
          featured ? "scale-[1.35] ring-[3px]" : "ring-2"
        )}
      >
        <Portrait src={item.image} className="block w-full h-full" />
      </span>
    </button>
  );
});

/* ---------------------------------------------------------------------
   SECTION 6: MAIN COMPONENT
   --------------------------------------------------------------------- */
export function TestimonialGlobe({
  items, // array of reviews: { id, name, role, company, quote, rating, city, country, lat, lng, image }
  eyebrow, // small coloured text above the heading
  heading, // big title
  caption, // small text under the title
  action, // optional extra element (e.g. a button) next to the stats
  autoRotate = true, // globe spins slowly by itself
  rotationSpeed = 0.12, // speed of that spin
  autoplay = false, // auto-switch to the next review every `interval` ms
  interval = 3500,
  active, // (optional) control which review is shown from outside
  onActiveChange, // (optional) called when the shown review changes
  size = 440, // (kept from original; real size is calculated from width)
  labels, // (optional) override button / pin text
  ref,
  className,
  onFocus,
  onBlur,
  ...rest
}) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const count = items.length;
  const headingId = React.useId(); // unique id linking the heading to the section for screen readers

  /* ---------- 6.1  REFS (handles to DOM elements / values that do not trigger re-render) ---------- */
  const rootRef = React.useRef(null); // the whole <section>
  const stageRef = React.useRef(null); // the inner layout box
  const globeBoxRef = React.useRef(null); // the square box holding globe + pins
  const canvasHostRef = React.useRef(null); // div where the <canvas> is inserted
  const pinRefs = React.useRef([]); // DOM element of every pin
  const regionRef = React.useRef(null); // the area holding the review card
  const leaderRef = React.useRef(null); // dotted line from pin to card (group)
  const lineRef = React.useRef(null); //   the dotted line
  const startDotRef = React.useRef(null); //   dot at the pin end
  const endDotRef = React.useRef(null); //   dot at the card end
  const globeRef = React.useRef(null); // the cobe globe object
  const kickRef = React.useRef(() => { }); // function that wakes up the animation loop
  const swipeRef = React.useRef(null); // remembers where a touch swipe started
  const writtenRef = React.useRef([]); // last values written to each pin (avoids useless DOM writes)

  /* ---------- 6.2  STATE (changing these re-renders the component) ---------- */
  const [width, setWidth] = React.useState(0); // measured width of the component
  const [glState, setGlState] = React.useState("pending"); // "pending" | "ready" | "unavailable" (WebGL status)
  const [glVersion, setGlVersion] = React.useState(0); // bumps to rebuild the globe after a WebGL context loss
  const [reduced, setReduced] = React.useState(false); // user prefers reduced motion?
  const [visible, setVisible] = React.useState(true); // is the component on screen / tab active?
  const [internal, setInternal] = React.useState(count > 0 ? 0 : null); // active review index (when not controlled from outside)
  const [pinned, setPinned] = React.useState(false); // user clicked a pin -> hold it
  const [hoverPin, setHoverPin] = React.useState(null); // index of pin under the mouse
  const [cardHover, setCardHover] = React.useState(false); // mouse is over the card
  const [keyboard, setKeyboard] = React.useState(false); // user is navigating with keyboard
  const [interacting, setInteracting] = React.useState(false); // user is dragging / globe still coasting
  const [target, setTarget] = React.useState(null); // pin the autoplay is heading toward
  const themeTick = useThemeTick();
  const dpr = useDevicePixelRatio();

  /* ---------- 6.3  DERIVED VALUES (simple maths from state/props) ---------- */
  // "Controlled" = parent passes `active`. Otherwise we manage it ourselves.
  const controlled = active !== undefined;
  const requested = controlled ? active : internal;
  // The review index actually shown (null if invalid / no reviews).
  const featured = requested !== null && requested >= 0 && requested < count ? Math.floor(requested) : null;

  // Layout sizes depend on the measured width:
  const pad = width >= 1024 ? 24 : width >= 620 ? 16 : 12; // side padding
  const inner = Math.max(0, Math.min(width, MAX_CONTENT) - pad * 2); // usable width
  const wide = inner >= 580; // wide = globe on the left, card on the right. Else stacked.
  // Globe size. Smaller share (0.34, max 340) -> more room for a WIDER review card.
  const diameter = Math.max(
    0,
    Math.round(width === 0 ? 320 : wide ? Math.min(340, inner * 0.34) : Math.min(300, inner * 0.72))
  );
  const pinSize = diameter >= 360 ? 42 : diameter >= 300 ? 36 : 32; // photo size on the globe
  const columnGap = width >= 1024 ? 28 : 20; // gap between globe and card (smaller = wider card)
  const roomy = true; // uses the larger card paddings / text sizes
  const ready = glState !== "pending"; // globe finished its first setup

  // Is autoplay allowed to run right now? Pauses on hover, drag, keyboard, hidden tab, etc.
  const running =
    autoplay && !reduced && count > 1 && !pinned && hoverPin === null && !cardHover && !keyboard && !interacting && visible;

  /* ---------- 6.4  "LIVE" OBJECT ----------
     A plain mutable object read by the animation loop every frame.
     Using a ref (not state) means the 60fps loop never forces React to re-render. */
  const live = React.useRef({
    phi: 0, // current globe rotation (left/right)
    theta: THETA, // globe tilt
    velocity: 0, // spin speed after you flick the globe
    dragging: false,
    interacting: false,
    pressed: false,
    moved: false,
    pointerId: -1,
    pressX: 0,
    pressY: 0,
    lastX: 0,
    lastMoveAt: 0,
    moveGap: 0,
    turn: null, // an in-progress "rotate to pin" animation
    vectors: [], // 3D position of each pin
    longitudes: [],
    depths: [], // how much each pin faces us
    size: diameter,
    pin: pinSize,
    wide,
    featured: null,
    requested: null,
    front: -1, // pin currently most in front
    spin: false,
    follow: false, // should the card follow whichever pin faces us?
    speed: rotationSpeed,
    reduced: false,
    onScreen: true,
    started: false,
    globeX: 0, // globe position inside the stage (for the dotted line)
    globeY: 0,
    anchorX: 0, // card position (the dotted line ends here)
    anchorY: 0,
    anchored: false,
    leaderShown: false,
    growStart: 0,
    growing: false,
    controlled,
    pinnedNow: false,
    onChange: onActiveChange,
  });

  // Small bag of callbacks the animation loop can call (kept fresh every render).
  const handlers = React.useRef({
    arrive: () => { },
    front: () => { },
    settle: () => { },
  });

  // Combine our own ref with the `ref` the parent may pass.
  const setRoot = React.useCallback(
    (el) => {
      rootRef.current = el;
      if (typeof ref === "function") ref(el);
      else if (ref) ref.current = el;
    },
    [ref]
  );

  // Wake up the animation loop (it sleeps when nothing moves, to save battery).
  const kick = () => kickRef.current();

  /* ---------- 6.5  ACTIONS ---------- */

  // Choose which review is shown.
  const select = React.useCallback((index) => {
    const s = live.current;
    if (index === s.featured) return;
    s.requested = index;
    if (!s.controlled) {
      s.featured = index;
      s.growStart = performance.now();
      setInternal(index);
    }
    s.onChange?.(index); // tell the parent
  }, []);

  // Rotate the globe so pin `index` faces the viewer.
  // commit=true -> also select that review when the rotation finishes (autoplay).
  const turnTo = React.useCallback((index, commit) => {
    const s = live.current;
    const lng = s.longitudes[index];
    if (lng === undefined) return;
    if (s.turn && s.turn.index === index && s.turn.commit === commit) return;
    const to = nearestTurn(s.phi, facingPhi(lng));
    s.velocity = 0;
    if (s.reduced) {
      // Reduced motion: jump instantly, no animation.
      s.phi = to;
      s.turn = null;
      if (commit) handlers.current.arrive(index);
    } else {
      s.turn = { from: s.phi, to, start: performance.now(), index, commit };
    }
    kickRef.current();
  }, []);

  // Select a review AND turn the globe to it (used by arrows / keyboard).
  const go = React.useCallback(
    (index) => {
      select(index);
      turnTo(index, false);
    },
    [select, turnTo]
  );

  /* ---------- 6.6  KEEP `live` IN SYNC WITH PROPS/STATE ----------
     Runs after every render. Copies the latest values into `live`
     so the animation loop always sees fresh data. */
  React.useLayoutEffect(() => {
    const s = live.current;
    if (s.vectors.length !== items.length) {
      s.front = -1;
      s.depths.length = items.length;
    }
    // Convert every city to a 3D point.
    s.vectors = items.map((item) => toCartesian(item.lat, item.lng));
    s.longitudes = items.map((item) => item.lng);
    // First time only: start with the first review already facing us.
    if (!s.started && diameter > 0) {
      s.started = true;
      const first = featured === null ? undefined : items[featured];
      if (first) s.phi = facingPhi(first.lng);
    }
    // If the parent changed `active`, turn the globe to match.
    if (s.featured !== featured) {
      const fromHost = controlled && featured !== s.requested;
      s.featured = featured;
      s.requested = featured;
      s.growStart = performance.now();
      if (fromHost && featured !== null && s.started) turnTo(featured, false);
    }
    s.size = diameter;
    s.pin = pinSize;
    s.wide = wide;
    s.speed = rotationSpeed;
    s.reduced = reduced;
    s.controlled = controlled;
    s.pinnedNow = pinned;
    s.onChange = onActiveChange;
    s.spin = autoRotate && !reduced && !pinned && !keyboard; // auto-spin only when idle
    s.follow = (!autoplay || interacting) && !pinned && hoverPin === null && !keyboard && !cardHover;
    handlers.current = {
      arrive: (index) => {
        setTarget(null);
        select(index);
      },
      front: (index) => select(index),
      settle: () => setInteracting(false),
    };
    kickRef.current();
  });

  /* ---------- 6.7  MEASURE THE COMPONENT WIDTH ---------- */
  React.useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const measure = () => setWidth(root.clientWidth);
    const observer = new ResizeObserver(measure); // re-measure on any size change
    observer.observe(root);
    measure();
    return () => observer.disconnect();
  }, []);

  /* ---------- 6.8  MEASURE WHERE THE GLOBE AND CARD ARE ----------
     Needed to draw the dotted line from the active pin to the card. */
  const measureAnchor = React.useCallback(() => {
    const stage = stageRef.current;
    const box = globeBoxRef.current;
    const region = regionRef.current;
    const s = live.current;
    if (!stage || !box || !region) {
      s.anchored = false;
      return;
    }
    const sr = stage.getBoundingClientRect();
    const br = box.getBoundingClientRect();
    const rr = region.getBoundingClientRect();
    s.globeX = br.left - sr.left;
    s.globeY = br.top - sr.top;
    s.anchorX = rr.left - sr.left; // left edge of the card
    s.anchorY = rr.top - sr.top + Math.min(44, rr.height / 2); // near the top of the card
    s.anchored = rr.width > 0;
    kickRef.current();
  }, []);

  React.useLayoutEffect(() => {
    measureAnchor();
    const stage = stageRef.current;
    const region = regionRef.current;
    if (!stage || !region) return;
    const observer = new ResizeObserver(measureAnchor);
    observer.observe(stage);
    observer.observe(region);
    return () => observer.disconnect();
  }, [measureAnchor, wide, diameter]);

  /* ---------- 6.9  WATCH: reduced motion, tab hidden, scrolled off screen ---------- */
  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const s = live.current;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotion = () => {
      s.reduced = motion.matches;
      setReduced(motion.matches);
      kickRef.current();
    };
    const sync = () => {
      setVisible(s.onScreen && !document.hidden);
      kickRef.current();
    };
    // IntersectionObserver tells us if the component is visible on screen.
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[entries.length - 1];
      s.onScreen = entry?.isIntersecting ?? true;
      sync();
    });
    onMotion();
    motion.addEventListener("change", onMotion);
    document.addEventListener("visibilitychange", sync);
    observer.observe(root);
    return () => {
      motion.removeEventListener("change", onMotion);
      document.removeEventListener("visibilitychange", sync);
      observer.disconnect();
    };
  }, []);

  /* ---------- 6.10  place()  -  POSITION EVERY PIN + THE DOTTED LINE ----------
     Called every animation frame. For each pin it:
       1. works out where it is on screen from the globe rotation
       2. sets opacity / size / z-index (front pins on top, back pins faded)
       3. finds which pin is most in front (so the card can follow it)
     Then it draws the dotted line from the active pin to the card. */
  const place = React.useCallback((now) => {
    const s = live.current;
    const written = writtenRef.current;
    const { vectors, size: d, phi, theta } = s;
    let front = -1;
    let frontDepth = -Infinity;
    let featuredPoint = null;
    for (let i = 0; i < vectors.length; i++) {
      const vector = vectors[i];
      if (!vector) continue;
      const point = project(vector, phi, theta, PIN_ALTITUDE);
      s.depths[i] = point.depth;
      if (point.depth > frontDepth) {
        frontDepth = point.depth;
        front = i;
      }
      const el = pinRefs.current[i];
      if (!el) continue;
      const isFeatured = i === s.featured;
      const opacity = Math.round(pinOpacity(point.depth, point.rim) * 100) / 100;
      const scale = pinScale(point.depth);
      const z = String((isFeatured ? 100 : 0) + Math.round((point.depth + 1) * 40));
      const hit = opacity > 0.4 ? "auto" : "none"; // faded pins cannot be clicked
      // Only touch the DOM if a value really changed (saves work).
      const prev = written[i]?.el === el ? written[i] : undefined;
      if (!prev || prev.opacity !== opacity) el.style.opacity = String(opacity);
      if (!prev || prev.z !== z) el.style.zIndex = z;
      if (!prev || prev.hit !== hit) el.style.pointerEvents = hit;
      written[i] = { el, opacity, z, hit };
      if (opacity > 0) {
        el.style.transform = `translate3d(${(point.x * d).toFixed(2)}px, ${(point.y * d).toFixed(2)}px, 0) translate(-50%, -50%) scale(${scale.toFixed(3)})`;
      }
      if (isFeatured) featuredPoint = { x: point.x * d, y: point.y * d, depth: point.depth, scale };
    }

    // If another pin clearly moved to the front, make its review the active one.
    if (front >= 0 && front !== s.front) {
      const current = s.depths[s.front] ?? -Infinity;
      if (s.front < 0) s.front = front;
      else if (frontDepth > current + FRONT_MARGIN) {
        s.front = front;
        if (s.follow && !s.turn) handlers.current.front(front);
      }
    }

    // ---- Dotted line from the active pin to the card ----
    const group = leaderRef.current;
    const line = lineRef.current;
    const startDot = startDotRef.current;
    const endDot = endDotRef.current;
    s.growing = false;
    if (!group || !line || !startDot || !endDot) return;
    // Show the line only in wide layout, when not turning, and the pin faces us.
    const show = s.wide && s.anchored && !s.turn && !!featuredPoint && featuredPoint.depth > 0.15;
    if (show !== s.leaderShown) {
      s.leaderShown = show;
      group.style.opacity = show ? "1" : "0";
      if (show) s.growStart = now;
    }
    if (!show || !featuredPoint) return;
    const x0 = s.globeX + featuredPoint.x;
    const y0 = s.globeY + featuredPoint.y;
    const dx = s.anchorX - x0;
    const dy = s.anchorY - y0;
    const distance = Math.hypot(dx, dy) || 1;
    const gap = (s.pin / 2) * 1.35 * featuredPoint.scale + 6; // start just outside the photo
    const length = Math.max(0, distance - gap);
    const grow = s.reduced ? 1 : smooth(clamp01((now - s.growStart) / 360)); // line "draws itself" in 360ms
    s.growing = grow < 1;
    const sx = x0 + (dx / distance) * gap;
    const sy = y0 + (dy / distance) * gap;
    line.style.transform = `translate(${sx.toFixed(2)}px, ${sy.toFixed(2)}px) rotate(${Math.atan2(dy, dx).toFixed(4)}rad) scaleX(${Math.max(0.001, length * grow).toFixed(2)})`;
    startDot.style.transform = `translate(${sx.toFixed(2)}px, ${sy.toFixed(2)}px)`;
    endDot.style.transform = `translate(${s.anchorX.toFixed(2)}px, ${s.anchorY.toFixed(2)}px) scale(${grow >= 1 ? 1 : 0})`;
  }, []);

  // Re-place pins right away when size / active review / layout changes.
  React.useLayoutEffect(() => {
    place(performance.now());
  }, [place, diameter, pinSize, featured, wide, count]);

  const hasSize = diameter > 0;

  /* ---------- 6.11  CREATE THE GLOBE + ANIMATION LOOP ----------
     Builds the <canvas>, starts cobe, and runs a requestAnimationFrame loop
     that: advances the rotation, redraws the globe, and calls place().
     The loop goes to sleep when nothing is moving. */
  React.useEffect(() => {
    const host = canvasHostRef.current;
    if (!host || !hasSize) return;
    const canvas = document.createElement("canvas");
    canvas.style.cssText = "width:100%;height:100%;display:block";
    host.appendChild(canvas);

    const s = live.current;
    let globe = null;

    // WHITE THEMED GLOBE CONFIGURATION
    try {
      globe = createGlobe(canvas, {
        devicePixelRatio: dpr,
        width: s.size,
        height: s.size,
        phi: s.phi,
        theta: s.theta,
        dark: 0, // 0 = light mode
        diffuse: 1.4, // how strongly light shades the sphere
        mapSamples: 16000, // number of dots that make the continents
        mapBrightness: 3.5, // brightness of those dots
        baseColor: [1, 1, 1], // sphere colour (white)
        markerColor: [0.06, 0.72, 0.51], // emerald
        glowColor: [0.93, 0.96, 0.94], // soft glow around the sphere
        markers: [], // we use our own HTML pins, not cobe markers
        markerElevation: 0,
      });
    } catch {
      globe = null; // WebGL not available -> fallback drawing is shown instead
    }

    const gl = globe ? (canvas.getContext("webgl2") || canvas.getContext("webgl")) : null;
    globeRef.current = globe;

    let raf = 0; // id of the scheduled animation frame
    let last = 0; // time of the previous frame
    let renderedSize = s.size;
    let phiLabel = "";
    // Is anything still moving? If not, we stop the loop to save CPU/GPU.
    const isBusy = () =>
      s.dragging ||
      s.interacting ||
      s.turn !== null ||
      s.growing ||
      Math.abs(s.velocity) > 1e-4 ||
      (s.spin && s.speed !== 0);

    // One animation frame.
    const frame = (now) => {
      raf = 0;
      const dt = last ? Math.min((now - last) / 1000, 0.1) : 0; // seconds since last frame
      last = now;
      const turn = s.turn;
      if (turn) {
        // A) Turning toward a chosen pin (eased animation).
        const t = s.reduced ? 1 : clamp01((now - turn.start) / TURN_MS);
        s.phi = turn.from + (turn.to - turn.from) * easeOutExpo(t);
        s.velocity = 0;
        if (t >= 1) {
          s.turn = null;
          s.phi = turn.to;
          if (turn.commit) handlers.current.arrive(turn.index);
        }
      } else if (!s.dragging) {
        if (Math.abs(s.velocity) > 1e-4) {
          // B) Coasting after a flick; slowly loses speed (friction).
          const steps = dt * 60;
          s.phi += s.velocity * steps;
          s.velocity *= Math.pow(DRAG_FRICTION, steps);
        } else {
          // C) Idle: slow automatic spin.
          s.velocity = 0;
          if (s.spin) s.phi += s.speed * dt;
        }
      }
      // Drag finished and globe stopped -> tell React interaction ended.
      if (s.interacting && !s.dragging && s.velocity === 0) {
        s.interacting = false;
        handlers.current.settle();
      }
      // Redraw the globe with the new rotation.
      if (globe) {
        if (s.size !== renderedSize) {
          renderedSize = s.size;
          globe.update({ phi: s.phi, theta: s.theta, width: s.size, height: s.size });
        } else {
          globe.update({ phi: s.phi, theta: s.theta });
        }
      }
      place(now); // move the pins
      // Handy for debugging: shows current angle as data-phi on the element.
      const label = s.phi.toFixed(2);
      if (label !== phiLabel) {
        phiLabel = label;
        host.dataset.phi = label;
      }
      // Ask for another frame only if still busy and visible.
      if (isBusy() && s.onScreen && !document.hidden) raf = requestAnimationFrame(frame);
      else last = 0;
    };

    // `kick` = "wake the loop up". Called whenever something changes.
    kickRef.current = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    kickRef.current();

    // The map dots load a bit late, so redraw a few times shortly after start.
    const retries = TEXTURE_RETRY_MS.map((ms) => window.setTimeout(() => kickRef.current(), ms));

    // If the GPU context is lost (e.g. tab sleeping), show fallback; rebuild when restored.
    const onLost = (event) => {
      event.preventDefault();
      setGlState("unavailable");
    };
    const onRestored = () => setGlVersion((v) => v + 1);
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);
    setGlState(gl ? "ready" : "unavailable");

    // Cleanup when the component unmounts or the globe must be rebuilt.
    return () => {
      cancelAnimationFrame(raf);
      retries.forEach((id) => window.clearTimeout(id));
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      kickRef.current = () => { };
      globe?.destroy();
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
      globeRef.current = null;
      host.replaceChildren();
      setGlState("pending");
    };
  }, [hasSize, dpr, glVersion]);

  /* ---------- 6.12  KEEP THE GLOBE WHITE ----------
     Re-applies the light colours whenever the theme changes,
     so the globe always stays white. */
  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const globe = globeRef.current;
    if (!globe) return;

    globe.update({
      dark: 0,
      diffuse: 1.3,
      mapBrightness: 3.5,
      baseColor: [1, 1, 1], // pure white sphere
      glowColor: [0.92, 0.96, 0.94], // soft emerald-sage glow
      markers: [],
    });
    kickRef.current();
  }, [ready, glVersion, themeTick]);

  /* ---------- 6.13  AUTOPLAY ----------
     When allowed to run, wait, then turn the globe to the next review.
     Starts the turn a little early (interval - TURN_MS) so the review
     changes right when the turn finishes. */
  React.useEffect(() => {
    if (!running) return;
    const id = window.setTimeout(() => {
      const next = ((live.current.featured ?? -1) + 1) % count; // wrap back to 0 at the end
      setTarget(next);
      turnTo(next, true);
    }, Math.max(0, interval - TURN_MS));
    return () => window.clearTimeout(id);
  }, [running, featured, interval, count, turnTo]);

  // If autoplay gets paused mid-turn, cancel that unfinished turn.
  React.useEffect(() => {
    if (running) return;
    const s = live.current;
    if (s.turn?.commit) {
      s.turn = null;
      kickRef.current();
    }
    setTarget(null);
  }, [running]);

  /* ---------- 6.14  CLICKED ("PINNED") REVIEW ----------
     After a click, the review stays locked for HOLD_MS (7s),
     or until Escape is pressed. */
  React.useEffect(() => {
    if (!pinned) return;
    const id = window.setTimeout(() => setPinned(false), HOLD_MS);
    const onKey = (event) => {
      if (event.key === "Escape") setPinned(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener("keydown", onKey);
    };
  }, [pinned, featured]);

  /* ---------- 6.15  EVENT HANDLERS ---------- */

  // Previous / next arrow. delta = -1 or +1. Wraps around at both ends.
  const step = (delta) => {
    if (count === 0) return;
    go((((featured ?? (delta > 0 ? -1 : 0)) + delta) % count + count) % count);
  };

  // Pins give us their DOM element so place() can move them.
  const registerPin = React.useCallback((index, el) => {
    pinRefs.current[index] = el;
  }, []);

  // Mouse enters a pin -> show that review instantly (flushSync = no delay).
  const onPinEnter = React.useCallback(
    (index, event) => {
      if (event.pointerType === "touch" || live.current.dragging) return;
      flushSync(() => {
        setHoverPin(index);
        select(index);
      });
    },
    [select]
  );

  // Mouse leaves a pin.
  const onPinLeave = React.useCallback((index, event) => {
    if (event.pointerType === "touch") return;
    setHoverPin((current) => (current === index ? null : current));
  }, []);

  // Keyboard on a pin: arrows move to neighbour, Home / End jump to first / last.
  const onPinKey = React.useCallback(
    (index, event) => {
      const total = live.current.vectors.length;
      if (event.altKey || event.ctrlKey || event.metaKey || total === 0) return;
      let next;
      if (event.key === "ArrowRight") next = (index + 1) % total;
      else if (event.key === "ArrowLeft") next = (index - 1 + total) % total;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = total - 1;
      else return;
      event.preventDefault();
      go(next);
      pinRefs.current[next]?.focus({ preventScroll: true });
    },
    [go]
  );

  // Click / tap on a pin: select it and lock it. Click again to unlock.
  const onPinPress = React.useCallback(
    (index) => {
      const s = live.current;
      if (s.moved) {
        // It was really a drag, not a click -> ignore.
        s.moved = false;
        return;
      }
      if (s.pinnedNow && s.featured === index) {
        setPinned(false);
        return;
      }
      select(index);
      setPinned(true);
      turnTo(index, false);
    },
    [select, turnTo]
  );

  // Pin gets keyboard focus -> show its review and turn the globe if it is on the back side.
  const onPinFocus = React.useCallback(
    (index, target) => {
      if (!target.matches(":focus-visible")) return;
      select(index);
      if ((live.current.depths[index] ?? -1) < 0.55) turnTo(index, false);
    },
    [select, turnTo]
  );

  // Start dragging the globe.
  const beginDrag = (event) => {
    const s = live.current;
    s.dragging = true;
    s.interacting = true;
    s.turn = null; // cancel any turn in progress
    event.currentTarget.setPointerCapture(event.pointerId); // keep receiving events even if pointer leaves
    setInteracting(true);
    kick();
  };

  // Stop dragging.
  const endDrag = () => {
    const s = live.current;
    s.dragging = false;
    s.pressed = false;
    s.pointerId = -1;
    kick();
  };

  /* ---------- 6.16  VALUES USED BY THE LAYOUT BELOW ---------- */
  const tabStop = featured ?? 0; // only this pin can be reached with Tab
  // Average rating shown in the header stats.
  const avg = (() => {
    const rated = items.filter((item) => typeof item.rating === "number");
    if (rated.length === 0) return null;
    return (rated.reduce((sum, item) => sum + (item.rating ?? 0), 0) / rated.length).toFixed(1);
  })();
  // How many different countries / cities (stats).
  const countries = new Set(items.map((item) => item.country ?? item.city)).size;
  // THE review to show. Just read straight from `items`:
  // no old/new card swapping any more, so no transition.
  const shownItem = featured === null ? undefined : items[featured];
  // Heading font size depends on screen width.
  const headingSize = wide
    ? width >= 1024
      ? "text-4xl leading-[1.1]"
      : "text-[1.75rem] leading-[1.15]"
    : width >= 420
      ? "text-[1.65rem] leading-[1.15]"
      : "text-2xl leading-tight";

  /* ---------- 6.17  RENDER (what appears on the page) ---------- */
  return (
    <section
      {...rest}
      ref={setRoot}
      data-slot="testimonial-globe"
      data-layout={wide ? "wide" : "stacked"}
      data-active={featured ?? ""}
      data-paused={pinned ? "true" : "false"}
      data-autoplay={running ? "running" : "held"}
      data-gl={glState}
      aria-labelledby={rest["aria-labelledby"] ?? (heading ? headingId : undefined)}
      style={{
        background: "transparent",
      }}
      className={cx("relative isolate w-full text-foreground", className)}
      // Pause autoplay while the user is using the keyboard inside the component.
      onFocus={(event) => {
        onFocus?.(event);
        if (event.target.matches(":focus-visible")) setKeyboard(true);
      }}
      onBlur={(event) => {
        onBlur?.(event);
        const next = event.relatedTarget;
        if (!next || !event.currentTarget.contains(next)) setKeyboard(false);
      }}
    >
      {/* STAGE: wide screens = 2-column grid (globe | text + card).
                 narrow screens = one column stacked. */}
      <div
        ref={stageRef}
        className={cx("relative mx-auto w-full", wide ? "grid items-center gap-y-6 py-8" : "flex flex-col items-center gap-4 py-4")}
        style={{
          maxWidth: "100%",
          paddingInline: pad,
          ...(wide
            ? { gridTemplateColumns: `${diameter}px minmax(0, 1fr)`, columnGap, justifyContent: "center" }
            : {}),
        }}
      >
        {/* ===== PART A: HEADER (eyebrow, title, caption, stats) ===== */}
        <header
          className={cx(
            "flex min-w-0 flex-col",
            wide ? "col-start-2 row-start-1 items-start self-end text-left" : "w-full items-center text-center"
          )}
        >
          {eyebrow && (
            <p className="m-0 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--accent-mint, #10b981)" }}>
              {eyebrow}
            </p>
          )}
          {heading && (
            <h2 id={headingId} className={cx("m-0 mt-2 text-balance font-bold tracking-tight", headingSize)} style={{ color: "var(--text-primary, #0b241c)" }}>
              {heading}
            </h2>
          )}
          {caption && (
            <p className="m-0 mt-2.5 max-w-prose text-pretty text-sm font-normal" style={{ color: "var(--text-secondary, #3d564d)" }}>
              {caption}
            </p>
          )}
          {/* Stats row: "N reviews | ★ average | N cities" + optional `action` element */}
          <div className={cx("flex flex-wrap items-center gap-x-5 gap-y-2", wide ? "mt-4 justify-start" : "mt-3 justify-center")}>
            <dl className="m-0 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <div className="flex items-baseline gap-1">
                <dt className="order-2" style={{ color: "var(--text-muted, #6e847c)" }}>{count === 1 ? "review" : "reviews"}</dt>
                <dd className="order-1 m-0 font-bold tabular-nums" style={{ color: "var(--text-primary, #0b241c)" }}>{count}</dd>
              </div>
              {avg !== null && (
                <>
                  <span aria-hidden="true" className="h-3 w-px bg-gray-300 dark:bg-gray-700" />
                  <div className="flex items-baseline gap-1">
                    <dt className="order-2" style={{ color: "var(--text-muted, #6e847c)" }}>average</dt>
                    <dd className="order-1 m-0 inline-flex items-center gap-1 font-bold tabular-nums text-amber-500">
                      <StarIcon className="w-3.5 h-3.5 self-center fill-amber-500" />
                      {avg}
                    </dd>
                  </div>
                </>
              )}
              <span aria-hidden="true" className="h-3 w-px bg-gray-300 dark:bg-gray-700" />
              <div className="flex items-baseline gap-1">
                <dt className="order-2" style={{ color: "var(--text-muted, #6e847c)" }}>{countries === 1 ? "city" : "cities"}</dt>
                <dd className="order-1 m-0 font-bold tabular-nums" style={{ color: "var(--text-primary, #0b241c)" }}>{countries}</dd>
              </div>
            </dl>
            {action}
          </div>
        </header>

        {/* ===== PART B: GLOBE BOX (canvas + pins + drag handling) =====
            The pointer handlers below make the globe draggable:
              down  -> remember start point
              move  -> rotate globe by how far the finger/mouse moved
              up    -> let go; keep spinning a little (momentum) if flicked */}
        <div
          ref={globeBoxRef}
          data-globe-box
          className={cx("relative shrink-0 touch-pan-y select-none", wide && "col-start-1 row-span-2 row-start-1 self-center")}
          style={{ width: diameter, height: diameter }}
          onPointerDown={(event) => {
            if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
            const s = live.current;
            s.pressed = true;
            s.moved = false;
            s.pointerId = event.pointerId;
            s.pressX = s.lastX = event.clientX;
            s.pressY = event.clientY;
            s.lastMoveAt = event.timeStamp;
            s.moveGap = 0;
            s.velocity = 0;
            // Pressing on empty globe starts a drag right away; pressing a pin waits to see if it is a click.
            if (!event.target.closest("[data-pin]")) beginDrag(event);
          }}
          onPointerMove={(event) => {
            const s = live.current;
            if (!s.pressed || event.pointerId !== s.pointerId) return;
            if (!s.dragging) {
              // Ignore tiny wiggles (DRAG_SLOP) so clicks still work.
              if (Math.hypot(event.clientX - s.pressX, event.clientY - s.pressY) < DRAG_SLOP) return;
              s.moved = true;
              beginDrag(event);
            }
            const now = event.timeStamp;
            // Horizontal movement -> rotation angle.
            const delta = ((event.clientX - s.lastX) / Math.max(s.size, 1)) * Math.PI;
            const elapsed = Math.max(now - s.lastMoveAt, 1);
            s.moveGap = elapsed;
            s.lastX = event.clientX;
            s.lastMoveAt = now;
            s.phi += delta;
            s.velocity = (delta / elapsed) * (1000 / 60); // remember speed for the flick
            if (Math.abs(event.clientX - s.pressX) > DRAG_SLOP) s.moved = true;
          }}
          onPointerUp={(event) => {
            const s = live.current;
            if (event.pointerId !== s.pointerId) return;
            if (s.dragging) {
              // If the pointer stopped before release, do not flick.
              const grace = Math.min(250, Math.max(RELEASE_GRACE_MS, s.moveGap * 1.5));
              if (s.reduced || event.timeStamp - s.lastMoveAt > grace) s.velocity = 0;
              if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
            }
            endDrag();
          }}
          onPointerCancel={() => {
            live.current.velocity = 0;
            endDrag();
          }}
          onLostPointerCapture={(event) => {
            if (event.pointerId === live.current.pointerId) endDrag();
          }}
        >
          {/* Fallback: simple line-drawn globe, only if WebGL is not available */}
          {glState === "unavailable" && (
            <div
              aria-hidden="true"
              data-globe-fallback
              className="pointer-events-none absolute inset-[10%] overflow-hidden rounded-full border border-gray-200"
              style={{
                background: "radial-gradient(circle at 36% 30%, rgba(16, 185, 129, 0.08), transparent 72%)",
              }}
            >
              <svg viewBox="0 0 100 100" className="w-full h-full text-emerald-800/15" fill="none" stroke="currentColor" strokeWidth="0.6">
                <ellipse cx="50" cy="50" rx="50" ry="14" />
                <ellipse cx="50" cy="50" rx="50" ry="32" />
                <line x1="0" y1="50" x2="100" y2="50" />
                <ellipse cx="50" cy="50" rx="18" ry="50" />
                <ellipse cx="50" cy="50" rx="36" ry="50" />
                <line x1="50" y1="0" x2="50" y2="100" />
              </svg>
            </div>
          )}

          {/* The real globe: the <canvas> is inserted into this div by the effect in 6.11.
              Fades in once ready. Cursor shows grab / grabbing hand. */}
          <div
            ref={canvasHostRef}
            data-globe
            aria-hidden="true"
            className={cx(
              "absolute inset-0 cursor-grab transition-opacity duration-150 active:cursor-grabbing motion-reduce:transition-none",
              ready ? "opacity-100" : "opacity-0"
            )}
          />

          {/* Layer holding all the photo pins on top of the globe.
              pointer-events-none on the layer, pins turn clicks back on for themselves. */}
          <div className="pointer-events-none absolute inset-0">
            {items.map((item, i) => (
              <Pin
                key={item.id}
                item={item}
                index={i}
                tone={toneOf(item, i)}
                size={pinSize}
                label={`${text.pin} ${item.name}, ${item.city}`}
                featured={i === featured}
                approaching={target === i}
                pressed={i === featured && pinned}
                tabbable={i === tabStop}
                register={registerPin}
                onEnter={onPinEnter}
                onLeave={onPinLeave}
                onPress={onPinPress}
                onKey={onPinKey}
                onFocusPin={onPinFocus}
              />
            ))}
          </div>
        </div>

        {/* ===== PART C: REVIEW CARD AREA =====
            Hovering the card pauses autoplay so you can read it. */}
        <div
          className={cx("relative w-full min-w-0", wide ? "col-start-2 row-start-2 self-start" : "w-full max-w-xl")}
          style={{ width: "100%" }}
          onPointerEnter={(event) => {
            if (event.pointerType !== "touch") setCardHover(true);
          }}
          onPointerLeave={(event) => {
            if (event.pointerType !== "touch") setCardHover(false);
          }}
        >
          {/* Region = where the card lives. Also handles touch swipes:
              swipe left -> next review, swipe right -> previous review.
              aria-live tells screen readers to announce the new review. */}
          <div
            ref={regionRef}
            data-quote-region
            aria-live={running ? "off" : "polite"}
            aria-atomic="true"
            className="touch-pan-y isolate"
            onPointerDown={(event) => {
              if (event.pointerType === "mouse") return;
              swipeRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
            }}
            onPointerUp={(event) => {
              const swipe = swipeRef.current;
              if (!swipe || swipe.id !== event.pointerId) return;
              swipeRef.current = null;
              const dx = event.clientX - swipe.x;
              const dy = event.clientY - swipe.y;
              // Count it as a swipe only if mostly horizontal and long enough.
              if (Math.abs(dx) > SWIPE_MIN && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
            }}
            onPointerCancel={() => {
              swipeRef.current = null;
            }}
          >
            {/* ONE fixed-size card. No transition, no old/new swapping.
                key={shownItem.id} makes React create a fresh card for each review,
                which also folds "See more" back closed automatically. */}
            {shownItem && featured !== null && (
              <QuoteCard
                key={shownItem.id}
                item={shownItem}
                index={featured}
                tone={toneOf(shownItem, featured)}
                roomy={roomy}
              />
            )}
          </div>

          {/* Previous / counter / next buttons, floating at the card's top-right.
              (Only shown when there is more than one review.) */}
          {count > 1 && (
            <div className={cx("absolute z-10 flex items-center gap-1", roomy ? "right-7 top-7" : "right-4 top-4")}>
              <button
                type="button"
                aria-label={text.previous}
                className="grid w-8 h-8 place-items-center rounded-full bg-black/5 dark:bg-white/10 text-gray-700 dark:text-gray-200 transition-colors hover:bg-black/10 dark:hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-emerald-600 cursor-pointer"
                onClick={() => step(-1)}
              >
                <Chevron direction="left" />
              </button>
              {/* Counter like "2 / 11" */}
              <span className="min-w-10 text-center text-xs font-semibold tabular-nums text-gray-600 dark:text-gray-300">
                {featured === null ? "–" : featured + 1} / {count}
              </span>
              <button
                type="button"
                aria-label={text.next}
                className="grid w-8 h-8 place-items-center rounded-full bg-black/5 dark:bg-white/10 text-gray-700 dark:text-gray-200 transition-colors hover:bg-black/10 dark:hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-emerald-600 cursor-pointer"
                onClick={() => step(1)}
              >
                <Chevron direction="right" />
              </button>
            </div>
          )}
        </div>

        {/* ===== PART D: DOTTED LEADER LINE (wide layout only) =====
            A dotted line from the active pin on the globe to the review card.
            place() (6.10) moves and stretches it every frame. */}
        {wide && (
          <svg aria-hidden="true" data-leader className="pointer-events-none absolute left-0 top-0 z-[95] w-px h-px overflow-visible text-emerald-800">
            <g ref={leaderRef} className="opacity-0 transition-opacity duration-200 motion-reduce:transition-none">
              <line
                ref={lineRef}
                x1="0"
                y1="0"
                x2="1"
                y2="0"
                stroke="currentColor"
                strokeOpacity="0.4"
                strokeWidth="1.2"
                strokeDasharray="3 3"
                vectorEffect="non-scaling-stroke"
              />
              {/* small dot at the pin end */}
              <circle ref={startDotRef} r="2.5" className="fill-emerald-600" />
              {/* hollow dot at the card end */}
              <circle ref={endDotRef} r="3.5" className="fill-white stroke-emerald-600" strokeWidth="1.5" />
            </g>
          </svg>
        )}
      </div>
    </section>
  );
}

export default TestimonialGlobe;