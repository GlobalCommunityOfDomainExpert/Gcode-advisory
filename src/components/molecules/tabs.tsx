"use client";

import { ReactNode } from "react";
import { useControllableState } from "@/hooks/use-controllable-state";

export interface TabItem {
  value: string;
  label: ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
}

export function Tabs({ items, value, defaultValue, onChange }: TabsProps) {
  const [active, select] = useControllableState(
    value,
    defaultValue ?? items[0]?.value,
    onChange,
  );

  return (
    <div
      role="tablist"
      className="border-border-light flex gap-1 overflow-x-auto border-b"
    >
      {items.map((item) => {
        const isActive = item.value === active;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => select(item.value)}
            className={`text-body focus-visible:ring-primary shrink-0 border-b-2 px-4 py-2 font-medium whitespace-nowrap transition-colors hover:cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none ${
              isActive
                ? "border-secondary text-secondary"
                : "text-text-secondary hover:text-text-primary border-transparent"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
