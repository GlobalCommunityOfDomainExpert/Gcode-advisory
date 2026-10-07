import { Check } from "lucide-react";
import { Divider, Icon } from "@/components/atoms";

export type StepStatus = "completed" | "current" | "upcoming";

export interface Step {
  label: string;
  status: StepStatus;
}

export interface StepIndicatorProps {
  steps: Step[];
}

function connectorClass(active: boolean) {
  return active ? "border-primary!" : "";
}

export function StepIndicator({ steps }: StepIndicatorProps) {
  return (
    <div
      className="grid gap-y-2"
      style={{
        gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))`,
      }}
    >
      {steps.map((step, index) => {
        const leftActive = index > 0 && steps[index - 1].status === "completed";
        const rightActive = step.status === "completed";
        return (
          <div key={step.label} className="flex min-w-0 items-center">
            <div className="flex h-8 min-w-0 flex-1 items-center">
              {index > 0 && <Divider className={connectorClass(leftActive)} />}
            </div>
            <div
              className={`text-small flex size-8 shrink-0 items-center justify-center rounded-full font-semibold ${
                step.status === "completed"
                  ? "bg-primary text-white"
                  : step.status === "current"
                    ? "border-primary text-primary border-2"
                    : "border-border-light text-text-secondary border"
              }`}
            >
              {step.status === "completed" ? (
                <Icon icon={Check} size="sm" />
              ) : (
                index + 1
              )}
            </div>
            <div className="flex h-8 min-w-0 flex-1 items-center">
              {index < steps.length - 1 && (
                <Divider className={connectorClass(rightActive)} />
              )}
            </div>
          </div>
        );
      })}
      {steps.map((step) => (
        <p
          key={step.label}
          className={`text-small text-text-secondary min-w-0 text-center wrap-break-word ${
            step.status === "current" ? "text-text-primary! font-medium" : ""
          }`}
        >
          {step.label}
        </p>
      ))}
    </div>
  );
}
