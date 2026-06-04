"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Suspense, useState } from "react";
import { Toaster } from "@areeza/ui/components/sonner";
import { TooltipProvider } from "@areeza/ui/components/tooltip";
import { AppPrefsBridge } from "@/lib/app-prefs-bridge";
import { LocaleBridge } from "@/lib/locale-bridge";
import { MockFailBridge } from "@/lib/mock-fail-bridge";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1 },
        },
      }),
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={300}>
          <AppPrefsBridge />
          <LocaleBridge />
          <Suspense fallback={null}>
            <MockFailBridge />
          </Suspense>
          {children}
          <Toaster richColors position="top-center" />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
