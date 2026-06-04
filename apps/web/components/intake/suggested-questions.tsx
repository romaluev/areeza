"use client";

import { useRef } from "react";
import { useProximityHover } from "@areeza/ui/hooks/use-proximity-hover";
import { cn } from "@areeza/ui/lib/utils";
import { interactiveWeight } from "@areeza/ui/lib/font-weight";
import { Icon } from "@areeza/ui/icons";

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
  const listRef = useRef<HTMLDivElement>(null);
  useProximityHover(listRef, { axis: "y" });

  return (
    <div
      ref={listRef}
      className={cn(
        layout === "grid"
          ? "grid gap-2 sm:grid-cols-2"
          : "flex flex-col gap-2",
        className,
      )}
    >
      {prompts.map((p) => (
        <button
          key={p.id}
          type="button"
          data-proximity-id={p.id}
          disabled={disabled}
          onClick={() => onPick(p.text)}
          className={cn(
            "group flex items-start gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-left text-sm text-[var(--foreground)]",
            "transition-[border-color,background-color,font-weight] duration-[var(--dur-fast)]",
            interactiveWeight,
            "hover:border-[color-mix(in_oklab,var(--primary)_35%,var(--border))] hover:bg-[var(--card)]",
            "data-[proximity]:border-[color-mix(in_oklab,var(--primary)_35%,var(--border))] data-[proximity]:bg-[var(--card)] data-[proximity]:font-medium",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--ring)]",
            "disabled:pointer-events-none disabled:opacity-50",
          )}
        >
          <Icon
            name="sparkles"
            size="sm"
            className="mt-0.5 shrink-0 text-[var(--accent)] opacity-70 group-data-[proximity]:opacity-100"
          />
          <span className="leading-snug">{p.text}</span>
        </button>
      ))}
    </div>
  );
}
