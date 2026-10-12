"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/atoms";

/** Prints (or saves as PDF from the browser's print dialog). */
export function PrintButton() {
  return (
    <Button variant="outline" size="sm" onClick={() => window.print()}>
      <Printer className="size-4" aria-hidden="true" /> Print or save as PDF
    </Button>
  );
}
