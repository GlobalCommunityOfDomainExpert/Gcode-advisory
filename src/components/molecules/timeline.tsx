import { MapPin } from "lucide-react";
import { Icon } from "@/components/atoms";

export interface TimelineItem {
  title: string;
  time?: string;
  /** Organisation / secondary line under the title. */
  sub?: string;
  location?: string;
  description?: string;
  active?: boolean;
  past?: boolean;
}

export interface TimelineProps {
  items: TimelineItem[];
}

export function Timeline({ items }: TimelineProps) {
  return (
    <ol className="flex flex-col">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <li key={`${item.title}-${index}`} className="flex gap-4">
            <div className="flex flex-col items-center pt-1.5">
              <span
                className={`size-3 shrink-0 rounded-full ring-4 ${
                  item.active
                    ? "bg-primary ring-primary-light"
                    : "bg-border-hover ring-transparent"
                }`}
              />
              {!isLast && <span className="bg-border-light mt-1 w-px flex-1" />}
            </div>
            <div className={`min-w-0 ${isLast ? "" : "pb-6"} ${item.past ? "opacity-60" : ""}`}>
              {item.time && (
                <span className="bg-primary-light text-primary text-small mb-1 inline-block rounded-full px-2 py-0.5 font-semibold">
                  {item.time}
                </span>
              )}
              <h4 className="text-body text-text-primary font-semibold">
                {item.title}
              </h4>
              {item.sub && (
                <p className="text-small text-text-secondary">{item.sub}</p>
              )}
              {item.description && (
                <p className="text-small text-text-secondary mt-1">
                  {item.description}
                </p>
              )}
              {item.location && (
                <p className="text-small text-text-secondary mt-1 flex items-center gap-1">
                  <Icon icon={MapPin} size="sm" />
                  {item.location}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
