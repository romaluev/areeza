"use client";

import { forwardRef, type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "../../lib/utils";
import { springs } from "../../motion/springs";
import { useShape } from "../../lib/ff/shape-context";

interface ChatMessageProps extends Omit<HTMLMotionProps<"div">, "children"> {
  /** Who sent the message. `user` -> right-aligned accent bubble,
   *  `assistant` -> left-aligned plain text. */
  from: "user" | "assistant";
  /** Timestamp shown in the hover-revealed meta row (user-message only). */
  time?: ReactNode;
  /** Icon-only action buttons shown in the hover-revealed meta row. */
  actions?: ReactNode;
  /** Message body. When omitted the bubble is dropped. */
  children?: ReactNode;
}

// Vendored from Fluid Functionalism (r/chat-message.json), adapted to Areeza:
// file attachments dropped (intake is text-only); radius driven by the FF
// shape context, colours by Areeza tokens.
const ChatMessage = forwardRef<HTMLDivElement, ChatMessageProps>(
  ({ from, time, actions, children, className, ...props }, ref) => {
    const shape = useShape();
    const isUser = from === "user";
    const showTime = isUser && time != null;

    return (
      <motion.div
        ref={ref}
        layout="position"
        initial={{ opacity: 0, y: 8, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={springs.moderate}
        style={{ transformOrigin: isUser ? "bottom right" : "bottom left" }}
        className={cn(
          "group flex max-w-[80%] flex-col gap-1.5",
          isUser ? "items-end self-end" : "items-start self-start",
          className,
        )}
        {...props}
      >
        {children != null && children !== "" && (
          <div
            className={cn(
              "py-2 text-[14px] leading-relaxed whitespace-pre-wrap break-words text-pretty",
              isUser
                ? cn(
                    shape.bg,
                    "px-3.5 bg-[color-mix(in_oklab,var(--accent),var(--background)_45%)] text-accent-foreground",
                  )
                : "text-foreground",
            )}
          >
            {children}
          </div>
        )}
        {(showTime || actions != null) && (
          <div
            className={cn(
              "flex items-center gap-2 px-1 text-[12px] leading-none text-muted-foreground select-none",
              "opacity-0 pointer-events-none transition-opacity duration-150",
              "group-hover:opacity-100 group-hover:pointer-events-auto",
              "group-focus-within:opacity-100 group-focus-within:pointer-events-auto",
            )}
          >
            {showTime && <span className="tabular-nums">{time}</span>}
            {actions != null && (
              <span className="flex items-center gap-0.5">{actions}</span>
            )}
          </div>
        )}
      </motion.div>
    );
  },
);

ChatMessage.displayName = "ChatMessage";

export { ChatMessage };
export type { ChatMessageProps };
export default ChatMessage;
