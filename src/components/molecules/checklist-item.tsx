export interface ChecklistItemProps {
  label: string;
  subtext?: string;
  completed?: boolean;
  /** Makes the whole row a button (e.g. jump to the tab that completes this step). */
  onClick?: () => void;
}

export function ChecklistItem({
  label,
  subtext,
  completed = false,
  onClick,
}: ChecklistItemProps) {
  const content = (
    <>
      <input
        type="checkbox"
        checked={completed}
        readOnly
        tabIndex={-1}
        aria-label={label}
        className="border-border-light accent-primary pointer-events-none mt-0.5 size-5 shrink-0 rounded-sm border"
      />
      <div>
        <p
          className={`text-body font-medium ${
            completed ? "text-text-primary" : "text-text-secondary"
          }`}
        >
          {label}
        </p>
        {subtext && <p className="text-small text-text-secondary">{subtext}</p>}
      </div>
    </>
  );

  if (!onClick) return <div className="flex items-start gap-3">{content}</div>;

  return (
    <button
      type="button"
      onClick={onClick}
      className="focus-visible:ring-primary flex w-full items-start gap-3 rounded-sm text-left focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      {content}
    </button>
  );
}
