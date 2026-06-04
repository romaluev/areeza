"use client";

import type { ReactNode, Ref } from "react";
import { cn } from "@areeza/ui/lib/utils";
import {
  useStickToBottom,
  type UseStickToBottomOptions,
} from "../hooks/use-stick-to-bottom";

/** Flex height boundary under dashboard `main` — not the scroll element. */
export function PagePaneRoot({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex min-h-0 flex-1 flex-col overflow-hidden", className)}>
      {children}
    </div>
  );
}

/** Primary vertical scroll owner for a pane. */
export function ScrollArea({
  className,
  children,
  containerRef,
}: {
  className?: string;
  children: ReactNode;
  containerRef?: Ref<HTMLDivElement>;
}) {
  return (
    <div
      ref={containerRef}
      className={cn(
        "min-h-0 flex-1 overflow-y-auto overscroll-contain",
        className,
      )}
    >
      {children}
    </div>
  );
}

export type ChatScrollAreaProps = {
  className?: string;
  innerClassName?: string;
  children: ReactNode;
  stickToBottom?: UseStickToBottomOptions;
};

/** Chat transcript scroll region with stick-to-bottom while pinned near the end. */
export function ChatScrollArea({
  className,
  innerClassName,
  children,
  stickToBottom,
}: ChatScrollAreaProps) {
  const { containerRef } = useStickToBottom(stickToBottom ?? {});

  return (
    <ScrollArea className={className} containerRef={containerRef}>
      <div className={cn("flex flex-col", innerClassName)}>{children}</div>
    </ScrollArea>
  );
}
