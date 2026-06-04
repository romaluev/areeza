"use client";

import { ShapeProvider } from "@areeza/ui/lib/shape-context";
import { SurfaceProvider } from "@areeza/ui/lib/surface-context";
import { useAppStore } from "@/lib/use-app-store";
import { AppSidebar } from "./app-sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const density = useAppStore((s) => s.density);
  const shape = useAppStore((s) => s.shape);

  return (
    <SurfaceProvider level={1}>
      <ShapeProvider density={density === "compact" ? "tight" : "default"} preset={shape}>
        <div className="flex min-h-dvh bg-background">
          <AppSidebar />
          <div
            className="flex min-w-0 flex-1 flex-col"
            data-density={density}
          >
            {children}
          </div>
        </div>
      </ShapeProvider>
    </SurfaceProvider>
  );
}
