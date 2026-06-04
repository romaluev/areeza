"use client";

import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useMotionTransition } from "@areeza/ui/hooks/use-reduced-motion";
import { cn } from "@areeza/ui/lib/utils";
import type { CaseMessage } from "@areeza/core/types";

export function MessageBubble({ message }: { message: CaseMessage }) {
  const isUser = message.role === "user";
  const transition = useMotionTransition("gentle");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transition}
      className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
    >
      {isUser ? (
        <div className="max-w-[min(90%,28rem)] rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm leading-relaxed text-[var(--accent-foreground)] shadow-xs">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      ) : (
        <div className="max-w-[min(95%,32rem)] text-sm leading-relaxed text-[var(--foreground)]">
          <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-headings:my-2">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          </div>
        </div>
      )}
    </motion.div>
  );
}
