import * as React from "react";
import { motion } from "motion/react";

function AccordionItem({
  item,
  isOpen,
  onToggle,
  itemId,
  panelId,
}) {
  const contentRef = React.useRef(null);
  const [contentH, setContentH] = React.useState(0);

  React.useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setContentH(el.scrollHeight));
    ro.observe(el);
    setContentH(el.scrollHeight);
    return () => ro.disconnect();
  }, []);

  return (
    <motion.div
      layout
      style={{
        overflow: "hidden",
        borderRadius: "30px",
        background: "var(--bg-card)",
        color: "var(--text-primary)",
        boxShadow: isOpen
          ? "var(--dock-shadow)"
          : "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        border: isOpen
          ? "1px solid var(--accent-mint)"
          : "1px solid var(--border-subtle)",
        originX: 0.5,
        originY: 0,
        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
      }}
      transition={{ type: "spring", stiffness: 280, damping: 28, mass: 0.9 }}
      animate={{ scale: isOpen ? 1 : 0.985 }}
      initial={false}
    >
      <button
        id={itemId}
        type="button"
        aria-controls={panelId}
        aria-expanded={isOpen}
        onClick={onToggle}
        style={{
          display: "flex",
          width: "100%",
          cursor: "pointer",
          userSelect: "none",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          padding: "20px 28px",
          textAlign: "left",
          background: "transparent",
          border: "none",
          outline: "none",
          color: "inherit",
          fontFamily: "inherit",
        }}
      >
        <span
          style={{
            fontSize: "clamp(1.2rem, 1.6vw, 1.3rem)",
            fontWeight: 600,
            letterSpacing: "-0.015em",
            lineHeight: 1.4,
            color: "var(--text-primary)",
            fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
          }}
        >
          {item.question}
        </span>

        <motion.span
          aria-hidden="true"
          initial={false}
          animate={{
            rotate: isOpen ? 180 : 0,
            scale: isOpen ? 1.05 : 1,
          }}
          transition={{ type: "spring", stiffness: 480, damping: 28 }}
          style={{
            display: "inline-flex",
            width: "48px",
            height: "48px",
            flexShrink: 0,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            background: isOpen
              ? "var(--accent-emerald)"
              : "var(--bg-tertiary)",
            color: isOpen ? "#ffffff" : "var(--text-primary)",
            transition: "background 0.2s ease, color 0.2s ease",
          }}
        >
          {isOpen ? (
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 2"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M1 1h12"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M7 1v12M1 7h12"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          )}
        </motion.span>
      </button>

      <motion.div
        id={panelId}
        role="region"
        aria-labelledby={itemId}
        animate={{
          height: isOpen ? contentH : 0,
          opacity: isOpen ? 1 : 0,
        }}
        initial={false}
        transition={{
          height: { type: "spring", stiffness: 340, damping: 34, mass: 0.9 },
          opacity: { duration: 0.2, ease: "easeOut" },
        }}
        style={{ overflow: "hidden" }}
      >
        <motion.div
          ref={contentRef}
          animate={{ y: isOpen ? 0 : -8 }}
          transition={{
            type: "spring",
            stiffness: 360,
            damping: 30,
            mass: 0.8,
          }}
          style={{
            padding: "0 28px 28px 28px",
          }}
        >
          <p
            style={{
              fontSize: "1.05rem",
              lineHeight: "2",
              fontWeight: 400,
              letterSpacing: "normal",
              color: "var(--text-secondary)",
              fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
              margin: 0,
            }}
          >
            {item.answer}
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export function MotionAccordion({
  items,
  gap = 10,
  className,
}) {
  const rawId = React.useId();
  const baseId = `accordion-${rawId.replace(/:/g, "")}`;

  const [openIndex, setOpenIndex] = React.useState(null);

  const toggle = (i) => setOpenIndex((prev) => (prev === i ? null : i));

  return (
    <div
      className={className}
      style={{ width: "100%", maxWidth: "900px", margin: "0 auto" }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          borderRadius: "34px",
          padding: "12px",
          gap: `${gap}px`,
        }}
      >
        {items.map((item, i) => (
          <AccordionItem
            key={i}
            item={item}
            isOpen={openIndex === i}
            onToggle={() => toggle(i)}
            itemId={`${baseId}-trigger-${i}`}
            panelId={`${baseId}-panel-${i}`}
          />
        ))}
      </div>
    </div>
  );
}

export default MotionAccordion;
