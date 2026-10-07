"use client";

import { ReactNode, useId, useState } from "react";

export type TooltipPosition = "top" | "bottom" | "left" | "right";

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: TooltipPosition;
}

const positionClasses: Record<TooltipPosition, string> = {
  top: "bottom-full left-1/2 mb-1 -translate-x-1/2",
  bottom: "top-full left-1/2 mt-1 -translate-x-1/2",
  left: "right-full top-1/2 mr-1 -translate-y-1/2",
  right: "left-full top-1/2 ml-1 -translate-y-1/2",
};

export function Tooltip({ content, children, position = "top" }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const id = useId();

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {typeof children === "string" ? (
        <span
          tabIndex={0}
          aria-describedby={id}
          className="focus-visible:ring-primary focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          {children}
        </span>
      ) : (
        children
      )}
      <span
        role="tooltip"
        id={id}
        className={`bg-primary text-small pointer-events-none absolute z-10 rounded-sm px-2 py-1 whitespace-nowrap text-white shadow-lg transition-opacity ${
          positionClasses[position]
        } ${visible ? "opacity-100" : "opacity-0"}`}
      >
        {content}
      </span>
    </span>
  );
}
