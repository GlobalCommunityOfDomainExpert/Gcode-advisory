"use client";

import { InputHTMLAttributes, forwardRef, useEffect, useRef } from "react";

export interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "size"
> {
  label?: string;
  indeterminate?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    { label, indeterminate = false, className = "", id, ...props },
    forwardedRef,
  ) => {
    const internalRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (internalRef.current) {
        internalRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate]);

    return (
      <label
        htmlFor={id}
        className="text-body text-text-primary flex cursor-pointer items-start gap-2 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50"
      >
        <input
          id={id}
          type="checkbox"
          ref={(node) => {
            internalRef.current = node;
            if (typeof forwardedRef === "function") forwardedRef(node);
            else if (forwardedRef) forwardedRef.current = node;
          }}
          className={`border-border-light accent-primary focus-visible:ring-primary mt-0.5 size-5 shrink-0 rounded-sm border focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed ${className}`}
          {...props}
        />
        {label && <span className="min-w-0">{label}</span>}
      </label>
    );
  },
);

Checkbox.displayName = "Checkbox";
