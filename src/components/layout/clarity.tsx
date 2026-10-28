"use client";

import { useEffect } from "react";
import Clarity from "@microsoft/clarity";

/** Starts Microsoft Clarity once in the browser. Does nothing without a project id, and never in development. */
export function ClarityInit() {
  useEffect(() => {
    const id = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
    if (id && process.env.NODE_ENV === "production") Clarity.init(id);
  }, []);
  return null;
}
