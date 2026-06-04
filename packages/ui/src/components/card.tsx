"use client";

import * as React from "react";
import { cn } from "../lib/utils";
import { Elevated, SurfaceProvider } from "../lib/surface-context";
import { useShapeRadius } from "../lib/shape-context";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  surfaceOffset?: number;
}

export function Card({
  className,
  elevated = true,
  surfaceOffset = 0,
  children,
  ...props
}: CardProps) {
  const radius = useShapeRadius();

  if (!elevated) {
    return (
      <div
        className={cn(
          "text-[var(--card-foreground)] ring-1 ring-foreground/10",
          "bg-[var(--card)] shadow-surface-2",
          className,
        )}
        style={{ borderRadius: radius }}
        {...props}
      >
        {children}
      </div>
    );
  }

  return (
    <SurfaceProvider level={2 + surfaceOffset}>
      <Elevated
        offset={0}
        className={cn("text-[var(--card-foreground)]", className)}
        style={{ borderRadius: radius }}
      >
        <div {...props}>{children}</div>
      </Elevated>
    </SurfaceProvider>
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1.5 p-4", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-[var(--muted-foreground)]", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4 pt-0", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center p-4 pt-0", className)} {...props} />;
}
