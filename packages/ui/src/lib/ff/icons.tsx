"use client";

import type { ComponentType, SVGProps } from "react";

// Lean icon shim for the vendored Fluid Functionalism components. The FF
// registry backs `useIcon` with a multi-library icon-map; Areeza uses Hugeicons
// elsewhere, so to avoid a new dependency we resolve the handful of names the
// vendored components actually use to small inline stroke SVGs (lucide-shaped).

export interface IconProps
  extends Omit<SVGProps<SVGSVGElement>, "ref" | "size"> {
  size?: number;
  strokeWidth?: number;
}

export type IconComponent = ComponentType<IconProps>;

function base(
  paths: React.ReactNode,
): IconComponent {
  function FfIcon({ size = 16, strokeWidth = 1.5, className, ...props }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden
        {...props}
      >
        {paths}
      </svg>
    );
  }
  return FfIcon;
}

const Dot: IconComponent = ({ size = 16, className, ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden
    {...props}
  >
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const iconRegistry = {
  dot: Dot,
  "arrow-left": base(<path d="M19 12H5M12 19l-7-7 7-7" />),
  "arrow-right": base(<path d="M5 12h14M12 5l7 7-7 7" />),
  "chevron-down": base(<path d="m6 9 6 6 6-6" />),
  "chevron-right": base(<path d="m9 18 6-6-6-6" />),
  check: base(<path d="M20 6 9 17l-5-5" />),
  search: base(
    <>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </>,
  ),
  file: base(
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </>,
  ),
  globe: base(
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20" />
    </>,
  ),
  sparkles: base(
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2" />,
  ),
} as const;

export type IconName = keyof typeof iconRegistry;

/** Returns an icon component for the given name, falling back to a dot. */
export function useIcon(name: IconName): IconComponent {
  return iconRegistry[name] ?? Dot;
}

export { iconRegistry };
