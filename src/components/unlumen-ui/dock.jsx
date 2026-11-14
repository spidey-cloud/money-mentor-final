"use client";
import * as React from "react";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "motion/react";

import { cn } from "@/lib/utils";

const DEFAULT_SPRING = {
  stiffness: 400,
  damping: 25,
  mass: 0.4,
};

function DockSeparator() {
  return (
    <div className="mx-1 flex items-center self-stretch">
      <div className="h-6 w-px bg-foreground/10" />
    </div>
  );
}

function DockIcon({
  item,
  mouseX,
  magnification,
  distance,
  iconSize,
  borderRadius,
  alwaysShowLabels,
  springOptions,
  onHover,
  iconRef: externalIconRef
}) {
  const wrapperRef = React.useRef(null);

  const distanceFromMouse = useTransform(mouseX, (val) => {
    const el = wrapperRef.current;
    if (!el) return distance * 100;
    const rect = el.getBoundingClientRect();
    return Math.abs(val - (rect.left + rect.width / 2));
  });

  const gaussian = (d) =>
    (magnification - 1) * Math.exp(-(d * d) / (2 * distance * distance)) + 1;

  const widthRaw = useTransform(distanceFromMouse, (d) => iconSize * gaussian(d));
  const heightRaw = useTransform(distanceFromMouse, (d) => iconSize * gaussian(d));

  const width = useSpring(widthRaw, springOptions);
  const height = useSpring(heightRaw, springOptions);

  const Tag = item.href ? "a" : "button";

  return (
    // fixed height in-flow; width animates to push neighbors
    <motion.div
      ref={wrapperRef}
      className="relative flex items-end justify-center"
      style={{ width, height: iconSize }}>
      {/* absolute, anchored bottom so icon grows upward */}
      <motion.div
        ref={externalIconRef}
        style={{ width, height, bottom: 0 }}
        className="absolute">
        <Tag
          href={item.href}
          onClick={item.onClick}
          onMouseEnter={() => onHover(externalIconRef)}
          onMouseLeave={() => onHover(null)}
          aria-label={item.label}
          style={{ borderRadius }}
          className={cn(
            "flex h-full w-full items-center justify-center",
            "text-foreground/70 transition-colors duration-150",
            "hover:bg-foreground/[0.06] hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/20",
            "[&_svg]:size-[60%]"
          )}>
          {item.icon}
        </Tag>
      </motion.div>
      {alwaysShowLabels && (
        <span
          className="mt-1 text-xs font-semibold tracking-tight text-foreground/60 whitespace-nowrap pointer-events-none select-none leading-none">
          {item.label}
        </span>
      )}
    </motion.div>
  );
}

export function Dock({
  items,
  magnification = 1.8,
  distance = 120,
  iconSize = 40,
  gap = 4,
  borderRadius = 16,
  alwaysShowLabels = false,
  springOptions = DEFAULT_SPRING,
  className
}) {
  const mouseX = useMotionValue(Infinity);
  const dockRef = React.useRef(null);

  const iconRefs = React.useRef([]);

  const [hoveredIndex, setHoveredIndex] = React.useState(null);
  const [tooltipX, setTooltipX] = React.useState(0);
  const [tooltipBottomOffset, setTooltipBottomOffset] = React.useState(0);

  React.useEffect(() => {
    if (hoveredIndex === null) return;

    let raf;
    const update = () => {
      const iconEl = iconRefs.current[hoveredIndex]?.current;
      const dockEl = dockRef.current;
      if (iconEl && dockEl) {
        const iconRect = iconEl.getBoundingClientRect();
        const dockRect = dockEl.getBoundingClientRect();
        setTooltipX(iconRect.left - dockRect.left + iconRect.width / 2);
        setTooltipBottomOffset(dockRect.bottom - iconRect.top);
      }
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [hoveredIndex]);

  const handleHover = React.useCallback((ref) => {
    if (ref === null) {
      setHoveredIndex(null);
      return;
    }
    const idx = iconRefs.current.findIndex((r) => r === ref);
    setHoveredIndex(idx >= 0 ? idx : null);
  }, []);

  return (
    <motion.div
      ref={dockRef}
      className={cn(
        "relative flex items-end overflow-visible border border-foreground/[0.08] bg-background/80 px-2 py-2 shadow-none hover:shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_8px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] transition-shadow duration-200 backdrop-blur-xl",
        className
      )}
      style={{ gap, borderRadius }}
      onMouseMove={(e) => mouseX.set(e.clientX)}
      onMouseLeave={() => mouseX.set(Infinity)}>
      {items.map((item, i) => (
        <React.Fragment key={i}>
          <DockIcon
            item={item}
            mouseX={mouseX}
            magnification={magnification}
            distance={distance}
            iconSize={iconSize}
            borderRadius={borderRadius}
            alwaysShowLabels={alwaysShowLabels}
            springOptions={springOptions}
            onHover={handleHover}
            iconRef={iconRefs.current[i] ?? (iconRefs.current[i] = React.createRef())} />
          {item.separator && <DockSeparator />}
        </React.Fragment>
      ))}
      {!alwaysShowLabels && (
        <AnimatePresence>
          {hoveredIndex !== null && (
            <motion.div
              key="dock-tooltip"
              layoutId="dock-tooltip"
              className="pointer-events-none absolute flex flex-col items-center z-50"
              style={{
                left: tooltipX,
                bottom: tooltipBottomOffset + 10,
                x: "-50%",
              }}
              initial={{ opacity: 0, y: 5, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.95 }}
              transition={{ duration: 0.12, ease: "easeOut" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#ffffff",
                  color: "#18181b",
                  fontSize: "13.5px",
                  fontWeight: 500,
                  lineHeight: "1.2",
                  letterSpacing: "-0.01em",
                  padding: "5px 12px",
                  borderRadius: "9px",
                  border: "1px solid rgba(0, 0, 0, 0.08)",
                  boxShadow: "0 4px 14px -2px rgba(0, 0, 0, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)",
                  whiteSpace: "nowrap",
                  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                }}>
                {items[hoveredIndex].label}
              </span>
              <svg
                width="9"
                height="5"
                viewBox="0 0 9 5"
                style={{
                  marginTop: "-1px",
                  filter: "drop-shadow(0 1px 1px rgba(0, 0, 0, 0.04))",
                }}
                aria-hidden="true">
                <path d="M0 0L4.5 4.5L9 0" fill="#ffffff" stroke="rgba(0,0,0,0.06)" strokeWidth="0.5" />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </motion.div>
  );
}