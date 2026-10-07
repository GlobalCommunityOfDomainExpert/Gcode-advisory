"use client";

import { useId, useRef } from "react";
import { FileCheck, Loader2, Upload } from "lucide-react";
import { Icon, SectionLabel } from "@/components/atoms";
import { cn } from "@/lib/cn";

export interface UploadZoneProps {
  label: string;
  /** Short rule shown under the prompt, e.g. "Square, JPG or PNG, up to 5 MB". */
  hint: string;
  /** `accept` for the file picker. */
  accept: string;
  /** Name of the file already uploaded, if any. */
  fileName?: string;
  uploading?: boolean;
  /** Message from a failed upload. */
  error?: string;
  disabled?: boolean;
  onSelect: (file: File) => void;
}

/** Dashed click-to-upload box. The browser only hints at limits here; the server is what enforces type and size. */
export function UploadZone({ label, hint, accept, fileName, uploading = false, error, disabled = false, onSelect }: UploadZoneProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  return (
    <div>
      <SectionLabel className="mb-2">{label}</SectionLabel>
      <label
        htmlFor={id}
        className={cn(
          "text-text-secondary focus-within:ring-primary flex h-32 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed text-center focus-within:ring-2 focus-within:ring-offset-2",
          error ? "border-danger" : "border-border-light hover:border-border-hover",
          (disabled || uploading) && "cursor-not-allowed opacity-60",
        )}
      >
        <Icon icon={uploading ? Loader2 : fileName ? FileCheck : Upload} size="md" className={cn(uploading && "animate-spin", fileName && !uploading && "text-success")} />
        <span className={cn("text-small font-medium", fileName && "text-text-primary")}>{uploading ? "Uploading…" : fileName || "Click to upload"}</span>
        <span className="text-small">{hint}</span>
        <input
          ref={input}
          id={id}
          type="file"
          accept={accept}
          disabled={disabled || uploading}
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = ""; // allow choosing the same file again after an error
            if (file) onSelect(file);
          }}
        />
      </label>
      {error && (
        <p role="alert" className="text-small text-danger mt-1">
          {error}
        </p>
      )}
    </div>
  );
}
