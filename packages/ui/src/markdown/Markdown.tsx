import * as React from 'react'
import ReactMarkdown, { type Components, defaultUrlTransform } from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'
import { Icon } from "../icons";
import { cn } from "../lib/utils";
import { CodeBlock, InlineCode } from './CodeBlock'
import { preprocessFileCards } from './file-cards'
import { preprocessLinks } from './linkify'
import { preprocessMentionShortcodes } from "./mentions";

/**
 * Render modes for markdown content:
 *
 * - 'terminal': Raw output with minimal formatting, control chars visible
 *   Best for: Debug output, raw logs, when you want to see exactly what's there
 *
 * - 'minimal': Clean rendering with syntax highlighting but no extra chrome
 *   Best for: Chat messages, inline content, when you want readability without clutter
 *
 * - 'full': Rich rendering with beautiful tables, styled code blocks, proper typography
 *   Best for: Documentation, long-form content, when presentation matters
 */
export type RenderMode = 'terminal' | 'minimal' | 'full'

export interface MarkdownProps {
  children: string
  /**
   * Render mode controlling formatting level
   * @default 'minimal'
   */
  mode?: RenderMode
  className?: string
  /**
   * Message ID for memoization (optional)
   * When provided, memoizes parsed blocks to avoid re-parsing during streaming
   */
  id?: string
  /**
   * Callback when a URL is clicked
   */
  onUrlClick?: (url: string) => void
  /**
   * Callback when a file path is clicked
   */
  onFileClick?: (path: string) => void
  /**
   * Custom renderer for mention links (e.g. mention://task/UUID).
   * When not provided, mentions render as a simple styled span.
   */
  renderMention?: (props: { type: string; id: string }) => React.ReactNode
  /**
   * CDN hostname for file card detection (e.g. "static.areeza.uz").
   * When provided, enables file card preprocessing and rendering.
   */
  cdnDomain?: string
}

// Sanitization schema — extends GitHub defaults to allow code highlighting classes
// and the mention:// protocol used for @mentions.
const sanitizeSchema = {
  ...defaultSchema,
  protocols: {
    ...defaultSchema.protocols,
    href: [...(defaultSchema.protocols?.href ?? []), 'mention'],
  },
  attributes: {
    ...defaultSchema.attributes,
    div: [
      ...(defaultSchema.attributes?.div ?? []),
      'dataType',
      'dataHref',
      'dataFilename',
    ],
    code: [
      ...(defaultSchema.attributes?.code ?? []),
      ['className', /^language-/],
      ['className', /^hljs/],
    ],
    img: [
      ...(defaultSchema.attributes?.img ?? []),
      'alt',
    ],
  },
}

/**
 * Custom URL transform that allows mention:// protocol (used for @mentions)
 * while keeping the default security for all other URLs.
 */
function urlTransform(url: string): string {
  if (url.startsWith('mention://')) return url
  return defaultUrlTransform(url)
}


// File path detection regex - matches paths starting with /, ~/, or ./
const FILE_PATH_REGEX =
  /^(?:\/|~\/|\.\/)[\w\-./@]+\.(?:ts|tsx|js|jsx|mjs|cjs|md|json|yaml|yml|py|go|rs|css|scss|less|html|htm|txt|log|sh|bash|zsh|swift|kt|java|c|cpp|h|hpp|rb|php|xml|toml|ini|cfg|conf|env|sql|graphql|vue|svelte|astro|prisma)$/i

/**
 * Create custom components based on render mode
 */
function createComponents(
  mode: RenderMode,
  onUrlClick?: (url: string) => void,
  onFileClick?: (path: string) => void,
  renderMention?: (props: { type: string; id: string }) => React.ReactNode,
): Partial<Components> {
  const baseComponents: Partial<Components> = {
    // FileCard: intercept <div data-type="fileCard"> from preprocessFileCards
    div: ({ node, children, ...props }) => {
      const dataType = node?.properties?.dataType as string | undefined
      if (dataType === 'fileCard') {
        const rawHref = (node?.properties?.dataHref as string) || ''
        // Only allow http(s) URLs to prevent javascript: and other dangerous schemes.
        const href = /^https?:\/\//i.test(rawHref) ? rawHref : ''
        const filename = (node?.properties?.dataFilename as string) || ''
        return (
          <div className="my-1 flex items-center gap-2 rounded-md border border-border bg-muted/50 px-2.5 py-1 transition-colors hover:bg-muted">
            <Icon name="fileText" size="sm" className="shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{filename}</p>
            </div>
            {href && (
              <button
                type="button"
                className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                onClick={() => window.open(href, '_blank', 'noopener,noreferrer')}
              >
                <Icon name="download" size={14} />
              </button>
            )}
          </div>
        )
      }
      return <div {...props}>{children}</div>
    },
    // Images: render uploaded images with constrained sizing
    img: ({ src, alt }) => (
      <img src={src} alt={alt ?? ""} loading="lazy" />
    ),
    // Links: Make clickable with callbacks, or render as mention
    a: ({ href, children }) => {
      // Mention links: mention://member/id, mention://agent/id, mention://task/id, mention://all/all
      if (href?.startsWith('mention://')) {
        const mentionMatch = href.match(/^mention:\/\/(member|agent|issue|all)\/(.+)$/)
        if (mentionMatch?.[1] && mentionMatch[2]) {
          const type = mentionMatch[1]
          const id = mentionMatch[2]

          if (renderMention) {
            // Let the custom renderer opt out for types it doesn't handle
            // by returning null/undefined — we then fall through to the
            // default styled span so nothing ever disappears silently.
            const rendered = renderMention({ type, id })
            if (rendered) return <>{rendered}</>
          }

          // Fallback: render as a simple styled span
          return (
            <span className="mention">
              {children}
            </span>
          )
        }
        return (
          <span className="mention">
            {children}
          </span>
        )
      }

      const handleClick = (e: React.MouseEvent): void => {
        e.preventDefault()
        if (href) {
          // Check if it's a file path
          if (FILE_PATH_REGEX.test(href) && onFileClick) {
            onFileClick(href)
          } else if (onUrlClick) {
            onUrlClick(href)
          } else {
            // Default: open in new window
            window.open(href, '_blank', 'noopener,noreferrer')
          }
        }
      }

      return (
        <a href={href} onClick={handleClick}>
          {children}
        </a>
      )
    }
  }

  // Terminal mode: minimal formatting
  if (mode === 'terminal') {
    return {
      ...baseComponents,
      // No special code handling - just monospace
      code: ({ children }) => <code className="font-mono">{children}</code>,
      pre: ({ children }) => <pre className="font-mono whitespace-pre-wrap my-2">{children}</pre>,
      // Minimal paragraph spacing
      p: ({ children }) => <p className="my-1">{children}</p>,
      // Simple lists
      ul: ({ children }) => <ul className="list-disc list-inside my-1">{children}</ul>,
      ol: ({ children }) => <ol className="list-decimal list-inside my-1">{children}</ol>,
      li: ({ children }) => <li className="my-0.5">{children}</li>,
      // Plain tables
      table: ({ children }) => <table className="my-2 font-mono text-sm">{children}</table>,
      th: ({ children }) => <th className="text-left pr-4">{children}</th>,
      td: ({ children }) => <td className="pr-4">{children}</td>
    }
  }

  // Minimal / full modes: shared prose.css typography (matches ContentEditor)
  const proseCodeComponents = (blockClassName?: string): Partial<Components> => ({
    code: ({ className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || '')
      const isBlock =
        'node' in props && props.node?.position?.start.line !== props.node?.position?.end.line

      if (match || isBlock) {
        const code = String(children).replace(/\n$/, '')
        return <CodeBlock code={code} language={match?.[1]} mode="full" className={blockClassName} />
      }

      return <InlineCode>{children}</InlineCode>
    },
    pre: ({ children }) => <>{children}</>,
  })

  if (mode === 'minimal' || mode === 'full') {
    return {
      ...baseComponents,
      ...proseCodeComponents(mode === 'full' ? 'my-2' : 'my-1'),
    }
  }

  return baseComponents
}

/**
 * Markdown - Customizable markdown renderer with multiple render modes
 *
 * Features:
 * - Three render modes: terminal, minimal, full
 * - Syntax highlighting via Shiki
 * - GFM support (tables, task lists, strikethrough)
 * - Clickable links and file paths
 * - Memoization for streaming performance
 * - Pluggable mention rendering via renderMention prop
 */
export function Markdown({
  children,
  mode = 'minimal',
  className,
  onUrlClick,
  onFileClick,
  renderMention,
  cdnDomain
}: MarkdownProps): React.JSX.Element {
  const components = React.useMemo(
    () => createComponents(mode, onUrlClick, onFileClick, renderMention),
    [mode, onUrlClick, onFileClick, renderMention]
  )

  // Preprocess: convert mention shortcodes, raw URLs, and file cards to renderable content
  const processedContent = React.useMemo(
    () => {
      let result = preprocessMentionShortcodes(children)
      result = preprocessLinks(result)
      result = preprocessFileCards(result, cdnDomain ?? '')
      return result
    },
    [children, cdnDomain]
  )

  const useProse = mode === 'minimal' || mode === 'full'

  return (
    <div
      className={cn(
        useProse
          ? 'rich-text-editor readonly select-text text-sm break-words'
          : 'markdown-content select-text break-words',
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[[remarkGfm, { singleTilde: false }]]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema]]}
        urlTransform={urlTransform}
        components={components}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  )
}

/**
 * MemoizedMarkdown - Optimized for streaming scenarios
 *
 * Splits content into blocks and memoizes each block separately,
 * so only new/changed blocks re-render during streaming.
 */
export const MemoizedMarkdown = React.memo(Markdown, (prevProps, nextProps) => {
  // If id is provided, use it for memoization
  if (prevProps.id && nextProps.id) {
    return (
      prevProps.id === nextProps.id &&
      prevProps.children === nextProps.children &&
      prevProps.mode === nextProps.mode
    )
  }
  // Otherwise compare content and mode
  return prevProps.children === nextProps.children && prevProps.mode === nextProps.mode
})
MemoizedMarkdown.displayName = 'MemoizedMarkdown'
