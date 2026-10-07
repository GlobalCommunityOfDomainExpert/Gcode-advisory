"use client";

import { useEffect } from "react";
import { CircleCheck, Info } from "lucide-react";
import { Icon } from "@/components/atoms";

export interface ToastProps {
  message: string;
  tone?: "success" | "info";
  /** Called after `duration` ms so the owner can unmount it. */
  onDismiss?: () => void;
  duration?: number;
}

/** Small bottom-centre confirmation that dismisses itself after 5 seconds. */
export function Toast({ message, tone = "success", onDismiss, duration = 5000 }: ToastProps) {
  useEffect(() => {
    if (!onDismiss) return;
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [onDismiss, duration]);

  return (
    <div
      role="status"
      className="animate-menu-in bg-primary text-body fixed bottom-6 left-1/2 z-50 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-start gap-3 rounded-md px-4 py-3 text-white shadow-lg"
    >
      <span className="mt-0.5 text-white">
        <Icon icon={tone === "success" ? CircleCheck : Info} size="sm" />
      </span>
      <span>{message}</span>
    </div>
  );
}
