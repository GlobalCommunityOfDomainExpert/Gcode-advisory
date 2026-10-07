"use client";

import { ReactNode, useId } from "react";
import { Modal } from "@/components/molecules/modal";
import { Wordmark } from "./wordmark";

export interface AuthModalProps {
  title: ReactNode;
  subtitle: ReactNode;
  children: ReactNode;
  onClose: () => void;
  /** Render in place instead of a portal (previews, Storybook). */
  inline?: boolean;
}

/** The GCODE sign-in / sign-up dialog: navy brand panel + form, side by side from `md` up. */
export function AuthModal({ title, subtitle, children, onClose, inline }: AuthModalProps) {
  const titleId = useId();
  return (
    <Modal
      open
      onClose={onClose}
      inline={inline}
      size="xl"
      labelledBy={titleId}
      bodyClassName="p-0"
      panelClassName="overflow-hidden rounded-md"
    >
      <div className="grid md:min-h-[48rem] md:grid-cols-2">
        <div className="from-primary to-primary-hover hidden flex-col items-center justify-center gap-4 bg-linear-to-br p-10 text-center md:flex">
          <Wordmark size="lg" />
          <p className="text-body max-w-56 text-white/85">Connect, learn, and grow with the GCODE community.</p>
        </div>
        <div className="text-body text-text-primary flex flex-col justify-center space-y-6 px-6 py-10 sm:px-10">
          <div className="space-y-1 text-center">
            <h1 id={titleId} className="text-heading text-text-primary font-extrabold">
              {title}
            </h1>
            <p className="text-body text-text-secondary">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </Modal>
  );
}
