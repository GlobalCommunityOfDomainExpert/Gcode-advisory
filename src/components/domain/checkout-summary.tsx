import { Button, Divider } from "@/components/atoms";

export interface CheckoutLineItem {
  label: string;
  /** Secondary line under the label, e.g. duration and time. */
  sub?: string;
  value: string;
}

export interface CheckoutSummaryProps {
  items: CheckoutLineItem[];
  total: string;
  actionLabel?: string;
  onAction?: () => void;
  processing?: boolean;
}

export function CheckoutSummary({
  items,
  total,
  actionLabel = "Register",
  onAction,
  processing = false,
}: CheckoutSummaryProps) {
  return (
    <div className="bg-surface-light ring-primary/10 flex flex-col gap-3 rounded-lg p-6 shadow-sm ring-1">
      {items.map((item) => (
        <div
          key={item.label}
          className="text-body text-text-secondary flex items-start justify-between gap-4"
        >
          <span className="min-w-0">
            {item.label}
            {item.sub && (
              <span className="text-small text-text-secondary block">
                {item.sub}
              </span>
            )}
          </span>
          <span className="text-text-primary shrink-0 text-right font-semibold">
            {item.value}
          </span>
        </div>
      ))}
      <Divider />
      <div className="text-large text-text-primary flex items-center justify-between font-semibold">
        <span>Total</span>
        <span>{total}</span>
      </div>
      <Button
        variant="primary"
        onClick={onAction}
        loading={processing}
        className="w-full"
      >
        {actionLabel}
      </Button>
    </div>
  );
}
