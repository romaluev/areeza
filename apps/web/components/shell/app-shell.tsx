"use client";

import Link from "next/link";
import { useState } from "react";
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
import { AppSidebar } from "./app-sidebar";
import { useShellPageTitle } from "./use-shell-page-title";

export function AppShell({ children }: { children: React.ReactNode }) {
  const density = useAppStore((s) => s.density);
  const shape = useAppStore((s) => s.shape);
  const { locale } = useAppLocale();
  const copy = uiCopy(locale);
  const pageTitle = useShellPageTitle();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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
          </div>

          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetContent side="left" className="w-(--layout-app-sidebar-width) p-0" showClose={false}>
              <SheetTitle className="sr-only">Navigatsiya</SheetTitle>
              <AppSidebar mobile onNavigate={() => setMobileNavOpen(false)} />
            </SheetContent>
          </Sheet>
        </SidebarProvider>
       </FfShapeProvider>
      </ShapeProvider>
    </SurfaceProvider>
  );
}
