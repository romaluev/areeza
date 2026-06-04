"use client";

import { useState } from "react";
import { ShapeProvider } from "@areeza/ui/lib/shape-context";
import { SurfaceProvider } from "@areeza/ui/lib/surface-context";
import { Button } from "@areeza/ui/components/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@areeza/ui/components/sheet";
import { Icon } from "@areeza/ui/icons";
import { useAppStore } from "@/lib/use-app-store";
import { AppSidebar, SidebarPanel } from "./app-sidebar";
import { useMotionTransition } from "@areeza/ui/hooks/use-reduced-motion";
import { useSurfaceStyle } from "@areeza/ui/lib/surface-context";

export function AppShell({ children }: { children: React.ReactNode }) {
  const density = useAppStore((s) => s.density);
  const shape = useAppStore((s) => s.shape);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const surfaceStyle = useSurfaceStyle(0);
  const navTransition = useMotionTransition("moderate");

  return (
    <SurfaceProvider level={1}>
      <ShapeProvider density={density === "compact" ? "tight" : "default"} preset={shape}>
        <div className="flex min-h-dvh bg-background">
          <AppSidebar className="hidden h-dvh lg:flex" />
          <div
            className="flex min-w-0 flex-1 flex-col"
            data-density={density}
          >
            <header className="flex h-14 shrink-0 items-center gap-2 border-b border-[var(--border)] px-3 lg:hidden">
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
              <span className="text-sm font-semibold tracking-tight">Areeza</span>
            </header>
            {children}
          </div>
        </div>

        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetContent side="left" className="p-0" showClose>
            <SheetTitle className="sr-only">Navigatsiya</SheetTitle>
            <SidebarPanel
              className="h-dvh w-full border-0"
              collapsed={false}
              mounted
              surfaceStyle={surfaceStyle}
              navTransition={navTransition}
              onToggleCollapsed={() => setMobileNavOpen(false)}
              onPersistCollapsed={() => setMobileNavOpen(false)}
              showCollapseControl={false}
            />
          </SheetContent>
        </Sheet>
      </ShapeProvider>
    </SurfaceProvider>
  );
}
