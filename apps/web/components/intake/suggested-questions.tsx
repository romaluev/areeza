"use client";

import { Icon } from "@areeza/ui/icons";
import { cn } from "@areeza/ui/lib/utils";

type Prompt = { id: string; text: string };

type Props = {
  prompts: Prompt[];
  onPick: (text: string) => void;
  disabled?: boolean;
  className?: string;
  layout?: "grid" | "stack";
};

export function SuggestedQuestions({
  prompts,
  onPick,
  disabled,
  className,
  layout = "grid",
}: Props) {
  return (
    <div
      className={cn(
        layout === "grid" ? "grid gap-2 sm:grid-cols-2" : "flex flex-col gap-2",
        className,
      )}
    >
      {prompts.map((p) => (
        <button
          key={p.id}
          type="button"
          disabled={disabled}
          onClick={() => onPick(p.text)}
          className={cn(
            "group flex items-start gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-left text-sm text-foreground",
            "transition-colors hover:border-primary/30 hover:bg-muted/50",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "disabled:pointer-events-none disabled:opacity-50",
          )}
        >
          <Icon
            name="sparkles"
            size="sm"
            className="mt-0.5 shrink-0 text-accent-foreground opacity-70 group-hover:opacity-100"
          />
          <span className="leading-snug">{p.text}</span>
        </button>
      ))}
    </div>
  );
}
