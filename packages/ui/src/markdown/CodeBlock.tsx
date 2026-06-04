import * as React from "react";
import { codeToHtml, bundledLanguages, type BundledLanguage } from "shiki";
import { Icon } from "../icons";
import { Button } from "../components/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "../components/tooltip";
import { cn } from "../lib/utils";

export interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
  mode?: "terminal" | "minimal" | "full";
}

const LANGUAGE_ALIASES: Record<string, BundledLanguage> = {
  js: "javascript",
  ts: "typescript",
  py: "python",
  sh: "bash",
  zsh: "bash",
  yml: "yaml",
  rb: "ruby",
  rs: "rust",
  kt: "kotlin",
  "objective-c": "objc",
  objc: "objc",
};

const highlightCache = new Map<string, string>();
const CACHE_MAX_SIZE = 200;

function getCacheKey(code: string, lang: string): string {
  return `${lang}:${code}`;
}

function isValidLanguage(lang: string): lang is BundledLanguage {
  const normalized = LANGUAGE_ALIASES[lang] || lang;
  return normalized in bundledLanguages;
}

export function CodeBlock({
  code,
  language = "text",
  className,
  mode = "full",
}: CodeBlockProps): React.JSX.Element {
  const [highlighted, setHighlighted] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [copied, setCopied] = React.useState(false);

  const langLower = language.toLowerCase();
  const resolvedLang: string = LANGUAGE_ALIASES[langLower] || langLower;

  React.useEffect(() => {
    let cancelled = false;

    async function highlight(): Promise<void> {
      const cacheKey = getCacheKey(code, resolvedLang);
      const cached = highlightCache.get(cacheKey);
      if (cached) {
        if (!cancelled) {
          setHighlighted(cached);
          setIsLoading(false);
        }
        return;
      }

      try {
        const lang = isValidLanguage(resolvedLang) ? resolvedLang : "text";
        const html = await codeToHtml(code, {
          lang,
          themes: { light: "github-light", dark: "github-dark" },
          defaultColor: false,
        });

        if (highlightCache.size >= CACHE_MAX_SIZE) {
          const firstKey = highlightCache.keys().next().value;
          if (firstKey) highlightCache.delete(firstKey);
        }
        highlightCache.set(cacheKey, html);

        if (!cancelled) {
          setHighlighted(html);
          setIsLoading(false);
        }
      } catch (error) {
        console.warn(`Shiki highlighting failed for language "${resolvedLang}":`, error);
        if (!cancelled) {
          setHighlighted(null);
          setIsLoading(false);
        }
      }
    }

    void highlight();
    return () => {
      cancelled = true;
    };
  }, [code, resolvedLang]);

  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  }, [code]);

  if (mode === "terminal") {
    return (
      <pre className={cn("select-text font-mono text-sm whitespace-pre-wrap", className)}>
        <code className="font-mono">{code}</code>
      </pre>
    );
  }

  if (mode === "minimal") {
    if (isLoading || !highlighted) {
      return (
        <pre className={cn("select-text font-mono text-sm whitespace-pre-wrap", className)}>
          <code className="font-mono">{code}</code>
        </pre>
      );
    }

    return (
      <div
        className={cn(
          "select-text font-mono text-sm [&_pre]:!bg-transparent [&_pre]:!p-0 [&_pre]:whitespace-pre-wrap [&_pre]:break-all [&_code]:!bg-transparent [&_code]:font-mono [&_pre]:font-mono",
          className,
        )}
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />
    );
  }

  return (
    <div
      className={cn(
        "group relative mb-4 overflow-hidden rounded-lg border bg-muted/30 last:mb-0",
        className,
      )}
    >
      <div className="flex select-none items-center justify-between border-b bg-muted/50 px-3 py-1.5 text-xs">
        <span className="font-medium tracking-wide text-muted-foreground uppercase">
          {resolvedLang !== "text" ? resolvedLang : "plain text"}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleCopy}
              className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground"
              aria-label="Copy code"
            >
              {copied ? (
                <Icon name="check" size={14} className="text-success" />
              ) : (
                <Icon name="copy" size={14} />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy code</TooltipContent>
        </Tooltip>
      </div>

      <div className="overflow-x-auto p-3 select-text">
        {isLoading || !highlighted ? (
          <pre className="select-text font-mono text-sm break-all whitespace-pre-wrap">
            <code className="font-mono">{code}</code>
          </pre>
        ) : (
          <div
            className="font-mono text-sm [&_code]:!bg-transparent [&_code]:font-mono [&_pre]:!m-0 [&_pre]:!bg-transparent [&_pre]:!p-0 [&_pre]:break-all [&_pre]:font-mono [&_pre]:whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        )}
      </div>
    </div>
  );
}

export function InlineCode({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}): React.JSX.Element {
  return (
    <code
      className={cn(
        "rounded border border-foreground/[0.05] bg-foreground/[0.03] px-1.5 py-0.5 font-mono text-sm text-foreground/75",
        className,
      )}
    >
      {children}
    </code>
  );
}
