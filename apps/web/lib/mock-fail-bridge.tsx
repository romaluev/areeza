"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { armMockFailures } from "@areeza/core/api/mock-failure";

/** `?mockFail=listCases,getCase` arms simulated failures for demo retry toasts. */
export function MockFailBridge() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const raw = searchParams.get("mockFail");
    if (!raw?.trim()) return;
    const ops = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (ops.length) armMockFailures(...ops);
  }, [searchParams]);

  return null;
}
