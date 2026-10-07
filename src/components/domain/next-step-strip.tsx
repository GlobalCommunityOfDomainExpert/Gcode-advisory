import { ArrowRight, LucideIcon } from "lucide-react";
import { Button, Icon, SectionLabel } from "@/components/atoms";

export interface NextStepStripProps {
  icon: LucideIcon;
  title: string;
  text: string;
  action: string;
  onAction?: () => void;
}

/** A sentence and one button: an invitation, not an alert. */
export function NextStepStrip({ icon, title, text, action, onAction }: NextStepStripProps) {
  return (
    <aside className="bg-surface-light ring-primary/10 rounded-lg p-6 shadow-sm ring-1">
      <SectionLabel>Next step</SectionLabel>
      <h2 className="text-body text-text-primary mt-3 flex items-center gap-2 font-bold tracking-tight">
        <Icon icon={icon} size="sm" className="text-primary shrink-0" />
        {title}
      </h2>
      <p className="text-small text-text-secondary mt-1.5 leading-relaxed">{text}</p>
      <Button variant="outline" className="mt-4 w-full" onClick={onAction}>
        {action} <Icon icon={ArrowRight} size="sm" />
      </Button>
    </aside>
  );
}
