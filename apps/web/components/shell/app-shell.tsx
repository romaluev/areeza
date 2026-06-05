"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ShapeProvider } from "@areeza/ui/lib/shape-context";
import { FfShapeProvider } from "@areeza/ui/lib/ff/shape-context";
import { SurfaceProvider } from "@areeza/ui/lib/surface-context";
import { Button } from "@areeza/ui/components/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@areeza/ui/components/sheet";
import { SidebarProvider } from "@areeza/ui/components/sidebar";
import { Icon } from "@areeza/ui/icons";
import { uiCopy } from "@/lib/copy";
import { useAppLocale } from "@/lib/use-app-locale";
import { useAppStore } from "@/lib/use-app-store";
import { useActiveSituationStore } from "@/lib/use-active-situation-store";
import { useRightRailStore } from "@/lib/use-right-rail-store";
import { AppSidebar } from "./app-sidebar";
import { AssistantRail } from "./assistant-rail";
import { SettingsModal } from "@/components/settings/settings-modal";
import { useShellPageTitle } from "./use-shell-page-title";

/** Tracks whether the viewport is xl+ (desktop rail column) vs. below (Sheet). */
function useIsXl() {
  const [isXl, setIsXl] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1280px)");
    const onChange = () => setIsXl(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return isXl;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const density = useAppStore((s) => s.density);
  const shape = useAppStore((s) => s.shape);
  const { locale } = useAppLocale();
  const copy = uiCopy(locale);
  const pageTitle = useShellPageTitle();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const isXl = useIsXl();

  const railOpen = useRightRailStore((s) => s.open);
  const setRailOpen = useRightRailStore((s) => s.setOpen);
  const toggleRail = useRightRailStore((s) => s.toggle);
  const activeSituationId = useActiveSituationStore((s) => s.situationId);
  const activeStep = useActiveSituationStore((s) => s.step);
  // The rail is only meaningful on a situation, and not on the Chat step (the
  // conversation already fills the canvas there).
  const railAvailable = Boolean(activeSituationId) && activeStep !== "chat";
  const showRail = railOpen && railAvailable;

  // Global Cmd/Ctrl+. toggles the assistant rail (mirrors the "N" shortcut).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey) return;
      if (e.key !== ".") return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
      ) {
        return;
      }
      e.preventDefault();
      toggleRail();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [toggleRail]);

  return (
    <SurfaceProvider level={1}>
      <ShapeProvider density={density === "compact" ? "tight" : "default"} preset={shape}>
       <FfShapeProvider shape={shape === "pill" ? "pill" : "rounded"}>
        <SidebarProvider
          defaultOpen
          style={
            {
              "--sidebar-width": "var(--layout-app-sidebar-width)",
            } as React.CSSProperties
          }
        >
          <a
            href="#app-main"
            className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:text-sm focus:shadow-md"
          >
            {copy.skipLink}
          </a>
          <div className="flex h-dvh w-full overflow-hidden bg-background p-2 gap-2">
            <div className="hidden w-[var(--layout-app-sidebar-width)] shrink-0 md:block">
              <AppSidebar />
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-2" data-density={density}>
              <header className="flex h-12 shrink-0 items-center gap-2 px-2 md:hidden">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-9 shrink-0"
                  aria-label="Navigatsiyani ochish"
                  onClick={() => setMobileNavOpen(true)}
                >
                  <Icon name="sidebarExpand" size="sm" />
                </Button>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold tracking-tight">
                  {pageTitle}
                </span>
                {railAvailable ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-9 shrink-0"
                    aria-label={copy.assistantRailToggle}
                    onClick={toggleRail}
                  >
                    <Icon name="sparkles" size="sm" />
                  </Button>
                ) : null}
                <Button asChild variant="brand" size="sm" className="shrink-0">
                  <Link href="/situations/new">{copy.newSituation}</Link>
                </Button>
              </header>

              <main
                id="app-main"
                aria-label={copy.situationsHomeTitle}
                className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border/40 bg-card shadow-sm"
              >
                {children}
              </main>
            </div>

            {showRail && isXl ? (
              <div className="hidden w-[var(--layout-assistant-rail-width)] shrink-0 xl:block">
                <AssistantRail />
              </div>
            ) : null}
          </div>

          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetContent side="left" className="w-(--layout-app-sidebar-width) p-0" showClose={false}>
              <SheetTitle className="sr-only">Navigatsiya</SheetTitle>
              <AppSidebar mobile onNavigate={() => setMobileNavOpen(false)} />
            </SheetContent>
          </Sheet>

          <Sheet
            open={showRail && !isXl}
            onOpenChange={(open) => {
              if (!open) setRailOpen(false);
            }}
          >
            <SheetContent
              side="right"
              className="w-[min(100%,28rem)] p-0"
              showClose={false}
            >
              <SheetTitle className="sr-only">{copy.assistantRailTitle}</SheetTitle>
              <AssistantRail onClose={() => setRailOpen(false)} />
            </SheetContent>
          </Sheet>

          <SettingsModal />
        </SidebarProvider>
       </FfShapeProvider>
      </ShapeProvider>
    </SurfaceProvider>
  );
}
