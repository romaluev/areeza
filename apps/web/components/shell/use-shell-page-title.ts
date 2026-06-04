"use client";

import { usePathname } from "next/navigation";
import { resolveShellPageTitle } from "./shell-page-title";
import { useTopBarStore } from "./top-bar-store";

/** Title for mobile header; prefers published top-bar config. */
export function useShellPageTitle(): string {
  const pathname = usePathname();
  const publishedTitle = useTopBarStore((s) => s.config?.title);
  if (typeof publishedTitle === "string" && publishedTitle.length > 0) {
    return publishedTitle;
  }
  return resolveShellPageTitle(pathname);
}
