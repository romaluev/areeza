import * as React from "react";
import { cn } from "../lib/utils";

export interface TimelineItemProps extends React.HTMLAttributes<HTMLLIElement> {
  label: string;
  at?: string;
  note?: string;
  active?: boolean;
  completed?: boolean;
  isLast?: boolean;
}

export function TimelineItem({
  label,
  at,
  note,
  active = false,
  completed = false,
  isLast = false,
  className,
  ...props
}: TimelineItemProps) {
  return (
    <li
      data-slot="timeline-item"
      className={cn("relative flex gap-3 pb-6", isLast && "pb-0", className)}
      {...props}
    >
      <div className="flex flex-col items-center">
        <span
          className={cn(
            "relative z-10 flex size-2.5 shrink-0 rounded-full ring-2 ring-background",
            completed && "bg-success",
            active && !completed && "bg-primary",
            !active && !completed && "bg-border",
          )}
          aria-hidden
        />
        {!isLast ? (
          <span
            className={cn(
              "mt-1 w-px flex-1 bg-border",
              completed && "bg-success/40",
            )}
            aria-hidden
          />
        ) : null}
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <p
          className={cn(
            "text-sm leading-snug text-foreground",
            active && "font-medium",
          )}
        >
          {label}
        </p>
        {at ? (
          <time className="mt-0.5 block text-xs tabular-nums text-muted-foreground">
            {at}
          </time>
        ) : null}
        {note ? <p className="mt-1 text-xs text-muted-foreground">{note}</p> : null}
      </div>
    </li>
  );
}

export function TimelineList({
  className,
  ...props
}: React.HTMLAttributes<HTMLUListElement>) {
  return <ul className={cn("m-0 list-none p-0", className)} {...props} />;
}
