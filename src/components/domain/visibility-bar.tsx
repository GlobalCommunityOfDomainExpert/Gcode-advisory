import { Eye, EyeOff, Rocket } from "lucide-react";
import { Button, Icon } from "@/components/atoms";

export interface VisibilityBarProps {
  published: boolean;
  /** Overall profile completion, 0–100. */
  percent: number;
  /** How many sections are still incomplete. */
  sectionsLeft: number;
  /** Where the profile will appear, e.g. "Find Experts" or "the GCODE community". */
  where: string;
  onPreview?: () => void;
  onPublish?: () => void;
  onUnpublish?: () => void;
}

/**
 * Publish gate: a profile is HIDDEN from others until it is complete; then the owner publishes it deliberately.
 */
export function VisibilityBar({
  published,
  percent,
  sectionsLeft,
  where,
  onPreview,
  onPublish,
  onUnpublish,
}: VisibilityBarProps) {
  const preview = (
    <Button variant="secondary" size="sm" onClick={onPreview}>
      <Icon icon={Eye} size="sm" /> Preview
    </Button>
  );

  if (published)
    return (
      <div className="bg-success-light text-success flex flex-wrap items-center gap-x-4 gap-y-3 rounded-md px-5 py-4">
        <Icon icon={Eye} size="md" />
        <div className="min-w-0 flex-1">
          <p className="text-body font-semibold">Your profile is live</p>
          <p className="text-small text-success/90">It appears in {where}.</p>
        </div>
        <span className="flex gap-2">
          {preview}
          <Button variant="secondary" size="sm" onClick={onUnpublish}>
            Unpublish
          </Button>
        </span>
      </div>
    );

  if (percent < 100)
    return (
      <div className="bg-warning-light flex flex-wrap items-center gap-x-4 gap-y-3 rounded-md px-5 py-4">
        <span className="text-warning">
          <Icon icon={EyeOff} size="md" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-body text-text-primary font-semibold">Hidden from {where}</p>
          <p className="text-small text-text-secondary">
            Finish {sectionsLeft} more section{sectionsLeft === 1 ? "" : "s"} to publish. Nobody can see or book an
            incomplete profile.
          </p>
        </div>
        <span className="flex gap-2">
          {preview}
          <Button size="sm" disabled>
            Publish profile
          </Button>
        </span>
      </div>
    );

  return (
    <div className="bg-primary-light flex flex-wrap items-center gap-x-4 gap-y-3 rounded-md px-5 py-4">
      <span className="text-primary">
        <Icon icon={Rocket} size="md" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-body text-text-primary font-semibold">Ready to go live</p>
        <p className="text-small text-text-secondary">
          Everything required is filled in. Publish to appear in {where}.
        </p>
      </div>
      <span className="flex gap-2">
        {preview}
        <Button size="sm" onClick={onPublish}>
          Publish profile
        </Button>
      </span>
    </div>
  );
}
