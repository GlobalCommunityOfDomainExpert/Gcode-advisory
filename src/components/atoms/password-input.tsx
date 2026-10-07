"use client";

import { CSSProperties, forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input, InputProps } from "./input";

export type PasswordInputProps = Omit<InputProps, "type">;

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ style, ...props }, ref) => {
    const [visible, setVisible] = useState(false);

    const inputStyle: CSSProperties = { paddingRight: "2.5rem", ...style };

    return (
      <div className="relative">
        <Input
          ref={ref}
          type={visible ? "text" : "password"}
          style={inputStyle}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="text-text-secondary hover:text-text-primary absolute top-1/2 right-3 -translate-y-1/2"
        >
          {visible ? (
            <Eye className="size-5" aria-hidden="true" />
          ) : (
            <EyeOff className="size-5" aria-hidden="true" />
          )}
        </button>
      </div>
    );
  },
);

PasswordInput.displayName = "PasswordInput";
