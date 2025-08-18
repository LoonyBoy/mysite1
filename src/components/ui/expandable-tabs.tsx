"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useOnClickOutside } from "usehooks-ts";
// using relative import so the project resolves without relying on path aliases
import { cn } from "../../lib/utils";
import { LucideIcon } from "lucide-react";

interface Tab {
  title: string;
  icon: LucideIcon;
  type?: never;
}

interface Separator {
  type: "separator";
  title?: never;
  icon?: never;
}

type TabItem = Tab | Separator;

interface ExpandableTabsProps {
  tabs: TabItem[];
  className?: string;
  activeColor?: string;
  onChange?: (index: number | null) => void;
}

// Use translateX + opacity for labels to avoid layout reflow (width animations cause jank)
const spanVariants = {
  initial: { x: 8, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 8, opacity: 0 },
};

const transition = { duration: 0.22, ease: [0.22, 0.9, 0.32, 1] };

export function ExpandableTabs({
  tabs,
  className,
  activeColor = "text-primary",
  onChange,
}: ExpandableTabsProps) {
  const [selected, setSelected] = React.useState<number | null>(null);
  const outsideClickRef = React.useRef(null);

  useOnClickOutside(outsideClickRef, () => {
    setSelected(null);
    onChange?.(null);
  });

  const handleSelect = (index: number) => {
    setSelected(index);
    onChange?.(index);
  };

  const Separator = () => (
    <div className="mx-1 h-[24px] w-[1.2px] bg-border" aria-hidden="true" />
  );

  return (
    <div
      ref={outsideClickRef}
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-2xl border bg-background p-1 shadow-sm",
        className
      )}
    >
      {tabs.map((tab, index) => {
        if (tab.type === "separator") {
          return <Separator key={`separator-${index}`} />;
        }
        const Icon = (tab as any).icon;
        return (
          <button
            key={(tab as any).title}
            onClick={() => handleSelect(index)}
            className={cn(
              "relative flex items-center rounded-xl px-3 py-2 text-sm font-medium transition-colors duration-200",
              selected === index
                ? cn("bg-muted", activeColor)
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <span className="inline-flex items-center justify-center w-7 h-7 mr-2 rounded-md bg-transparent text-current">
              <Icon size={18} />
            </span>
            <AnimatePresence initial={false} mode="sync">
              {selected === index && (
                <motion.span
                  variants={spanVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={transition}
                  className="inline-block overflow-hidden"
                >
                  {(tab as any).title}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        );
      })}
    </div>
  );
}
export default ExpandableTabs;

