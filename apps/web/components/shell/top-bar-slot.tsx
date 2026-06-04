"use client";

import { usePathname } from "next/navigation";
import { TopBar } from "./top-bar";
import { resolveShellPageTitle } from "./shell-page-title";
import { useTopBarStore } from "./top-bar-store";

export function TopBarSlot() {
  const pathname = usePathname();
  const config = useTopBarStore((s) => s.config);
  const fallbackTitle = resolveShellPageTitle(pathname);

  const merged = {
    title: config?.title ?? fallbackTitle,
    description: config?.description,
    actions: config?.actions,
  };

  if (!merged.title && !merged.description && !merged.actions) {
    return null;
  }

  return <TopBar {...merged} />;
}
