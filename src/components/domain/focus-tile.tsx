import { ArrowRight } from "lucide-react";
import { Button, Icon, Progress, SectionLabel } from "@/components/atoms";

export interface FocusTileProps {
  eyebrow: string;
  value: string;
  label: string;
  text: string;
  cta: string;
  onCta?: () => void;
  cta2?: string;
  onCta2?: () => void;
  /** Profile completion %. Setting it switches the tile to its urgent (red) look with a progress bar. */
  ring?: number;
}

/** Dashboard: the ONE thing that needs attention today. Red + progress bar while the profile is incomplete. */
export function FocusTile({ eyebrow, value, label, text, cta, onCta, cta2, onCta2, ring }: FocusTileProps) {
  const urgent = ring !== undefined;
  return (
    <section
      className={`${
        urgent
          ? "bg-surface-light bg-linear-to-b from-secondary-light to-secondary-light ring-secondary/25"
          : "bg-surface-light bg-linear-to-b from-primary-light to-primary-light ring-primary/10"
      } rounded-lg p-6 ring-1 sm:p-8`}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-5">
        <div className="min-w-0 flex-1 basis-72">
          <SectionLabel className={urgent ? "text-secondary!" : "text-primary!"}>{eyebrow}</SectionLabel>
          <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span
              className={`text-display ${urgent ? "text-secondary" : "text-primary"} leading-none font-extrabold tracking-tight tabular-nums`}
            >
              {value}
            </span>
            <span className="text-large text-text-primary font-semibold">{label}</span>
          </div>
          <p className="text-body text-text-secondary mt-2 max-w-xl">{text}</p>
          {ring !== undefined && (
            <div className="mt-4 max-w-xs">
              <Progress value={ring} label="Profile completion" tone="secondary" />
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant={urgent ? "accent" : "primary"} onClick={onCta}>
            {cta} <Icon icon={ArrowRight} size="sm" />
          </Button>
          {cta2 && (
            <Button variant="secondary" onClick={onCta2}>
              {cta2}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
