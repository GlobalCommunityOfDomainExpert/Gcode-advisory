import { useState } from "react";

export function useControllableState(
  value: string | undefined,
  initialValue: string | undefined,
  onChange: ((value: string) => void) | undefined,
): [string | undefined, (next: string) => void] {
  const [internal, setInternal] = useState(initialValue);
  const active = value ?? internal;

  function select(next: string) {
    if (value === undefined) setInternal(next);
    onChange?.(next);
  }

  return [active, select];
}
