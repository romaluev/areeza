"use client";

import * as React from "react";
import { cn } from "../lib/utils";
import { useProximityHover } from "../hooks/use-proximity-hover";

export function Table({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div data-slot="table-container" className="relative w-full overflow-x-auto">
      <table
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  );
}

export function TableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("[&_tr]:border-b", className)} {...props} />;
}

export function TableBody({
  className,
  proximityHover = true,
  children,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement> & { proximityHover?: boolean }) {
  const bodyRef = React.useRef<HTMLTableSectionElement>(null);
  useProximityHover(bodyRef, { axis: "y", enabled: proximityHover });

  return (
    <tbody ref={bodyRef} className={cn("[&_tr:last-child]:border-0", className)} {...props}>
      {children}
    </tbody>
  );
}

export function TableFooter({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tfoot
      className={cn("border-t bg-[var(--surface-3)] font-medium [&>tr]:last:border-b-0", className)}
      {...props}
    />
  );
}

export function TableRow({
  className,
  rowId,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement> & { rowId?: string }) {
  const id = rowId ?? React.useId();

  return (
    <tr
      data-proximity-id={id}
      className={cn(
        "border-b border-[var(--border)] transition-[background-color] duration-[var(--dur-fast)]",
        "hover:bg-[var(--surface-3)] data-[proximity]:bg-[var(--surface-3)]",
        className,
      )}
      {...props}
    />
  );
}

export function TableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "h-9 px-3 text-left align-middle text-xs font-medium text-[var(--muted-foreground)]",
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-3 py-2 align-middle", className)} {...props} />;
}

export function TableCaption({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableCaptionElement>) {
  return (
    <caption
      className={cn("mt-4 text-sm text-[var(--muted-foreground)]", className)}
      {...props}
    />
  );
}
