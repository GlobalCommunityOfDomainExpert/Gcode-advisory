"use client";

import { ReactNode, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Icon } from "@/components/atoms";
import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/cn";
import { focusRing } from "@/lib/ui";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** Renders a header with a close button. Without it the close button floats top-right and you supply the heading. */
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Panel max width: `md` 28rem, `lg` 32rem, `xl` 48rem. */
  size?: "md" | "lg" | "xl";
  /** Replaces the default body spacing and 70vh scroll cap. Pass `p-0` for content that manages its own layout. */
  bodyClassName?: string;
  /** Replaces the default `rounded-md`, and is where to add e.g. `overflow-hidden`. */
  panelClassName?: string;
  /** `id` of a heading inside `children`, for dialogs that have no `title`. */
  labelledBy?: string;
  /** Render in place instead of in a portal, without scroll lock or focus handling. For previews and Storybook. */
  inline?: boolean;
}

const sizeClasses = { md: "max-w-md", lg: "max-w-lg", xl: "max-w-3xl" };

/**
 * The one dialog primitive: backdrop click and Escape close it, the page behind stops scrolling, focus moves into the
 * panel and returns to the trigger on close. AuthModal and BookingDialog are built on it.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
  bodyClassName = "px-6 py-4 max-h-[70vh] overflow-y-auto",
  panelClassName = "rounded-md",
  labelledBy,
  inline = false,
}: ModalProps) {
  const mounted = useMounted();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || inline) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus?.({ preventScroll: true });
    };
  }, [open, inline]);

  // No document to portal into on the server; waiting for mount on the client avoids a hydration mismatch.
  if (!open || (!inline && !mounted)) return null;

  const closeButton = (
    <button
      type="button"
      onClick={onClose}
      aria-label="Close"
      className={cn("text-text-secondary hover:text-text-primary rounded-sm", focusRing, !title && "absolute top-4 right-4 z-10")}
    >
      <Icon icon={X} size="sm" />
    </button>
  );

  const dialog = (
    <div className="bg-primary/40 fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
      {/* Centering lives on this inner wrapper, not the scrollable element: combining overflow-y-auto with flex
          centering on one element clips the start of overflowing content in most browsers. */}
      <div className="flex min-h-full items-center justify-center px-4 py-8">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : labelledBy}
          tabIndex={-1}
          onClick={(event) => event.stopPropagation()}
          className={cn("bg-surface-light relative w-full shadow-lg outline-none", sizeClasses[size], panelClassName)}
        >
          {title ? (
            <div className="border-border-light flex items-center justify-between border-b px-6 py-4">
              <h3 id={titleId} className="text-large text-text-primary font-semibold">
                {title}
              </h3>
              {closeButton}
            </div>
          ) : (
            closeButton
          )}
          <div className={cn("text-body text-text-primary", bodyClassName)}>{children}</div>
          {footer && <div className="border-border-light flex justify-end gap-2 border-t px-6 py-4">{footer}</div>}
        </div>
      </div>
    </div>
  );

  return inline ? dialog : createPortal(dialog, document.body);
}
