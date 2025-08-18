"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useOnClickOutside } from "usehooks-ts";
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
  /** Controlled selected index. If provided, component acts in controlled mode. */
  selectedIndex?: number | null;
}

const buttonVariants = {
  initial: {
    gap: 0,
    paddingLeft: ".5rem",
    paddingRight: ".5rem",
  },
  animate: (isSelected: boolean) => ({
    gap: isSelected ? ".5rem" : 0,
    paddingLeft: isSelected ? "1rem" : ".5rem",
    paddingRight: isSelected ? "1rem" : ".5rem",
  }),
};

const spanVariants = {
  // start slightly to the right and invisible, expand maxWidth and slide to place
  initial: { maxWidth: 0, opacity: 0, x: 12 },
  animate: { maxWidth: 240, opacity: 1, x: 0 },
  exit: { maxWidth: 0, opacity: 0, x: 12 },
};

const transition = { delay: 0.1, type: "spring", bounce: 0, duration: 0.6 };

export function ExpandableTabs({
  tabs,
  className,
  activeColor = "text-primary",
  onChange,
  selectedIndex,
}: ExpandableTabsProps) {
  const [internalSelected, setInternalSelected] = React.useState<number | null>(null);
  const outsideClickRef = React.useRef(null);

  const isControlled = selectedIndex !== undefined;
  const currentSelected = isControlled ? selectedIndex : internalSelected;

  useOnClickOutside(outsideClickRef, () => {
    if (!isControlled) setInternalSelected(null);
    onChange?.(null);
  });

  const handleSelect = (index: number) => {
    if (!isControlled) setInternalSelected(index);
    onChange?.(index);
  };

  const Separator = () => (
    <div className="mx-1 h-[24px] w-[1.2px] bg-border" aria-hidden="true" />
  );

  return (
    <div
      ref={outsideClickRef}
      className={cn(
        // keep tabs on a single row to avoid layout reflow when a label expands
        "flex items-center gap-2 flex-nowrap rounded-none border bg-background p-1 shadow-sm overflow-auto",
        className
      )}
    >
      {tabs.map((tab, index) => {
        if ((tab as Tab).type === "separator") {
          return <Separator key={`separator-${index}`} />;
        }

        const Icon = (tab as Tab).icon;
        return (
          <motion.button
            key={(tab as Tab).title}
            variants={buttonVariants}
            initial={false}
            animate="animate"
            custom={currentSelected === index}
            onClick={() => handleSelect(index)}
            transition={transition}
            className={cn(
              // prevent wrapping/height changes and keep consistent vertical alignment
              "relative inline-flex items-center rounded-none px-4 py-2 text-sm font-medium transition-colors duration-300 whitespace-nowrap leading-none",
              currentSelected === index
                ? cn("bg-muted text-white ring-1 ring-white/20 rounded-md", activeColor)
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <span className={cn("inline-flex items-center justify-center w-8 h-8 mr-2 rounded-md transition-colors", currentSelected === index ? "bg-white/10 text-white" : "bg-transparent text-muted-foreground")} aria-hidden>
              <Icon size={18} />
            </span>
            <AnimatePresence initial={false}>
              {currentSelected === index && (
                <motion.span
                  variants={spanVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={transition}
                  className="overflow-hidden inline-block align-middle ml-2 whitespace-nowrap leading-none"
                >
                  {(tab as Tab).title}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </div>
  );
}

export default ExpandableTabs;
