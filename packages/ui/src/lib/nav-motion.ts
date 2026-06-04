/**
 * Shared class fragments for vertical nav rows (sidebar, settings, lists).
 * Import from `@areeza/ui/lib/nav-motion` — do not duplicate in views.
 */

import { navLabelWeight } from "./font-weight";

/** Explicit property list — no `transition-all`. */
export const navRowTransition =
  "transition-[color,background-color,font-weight,opacity,box-shadow,width,height,padding] duration-[var(--dur-fast)] ease-[var(--ease-std)]";

export const navRowHover =
  "hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground";

/** Settings dialog sidebar — surface tokens, not app sidebar-accent. */
export const settingsRailTransition =
  "transition-[color,background-color,opacity,box-shadow,transform] duration-[var(--dur-fast)] ease-[var(--ease-std)]";

export const settingsRailHover = "hover:bg-surface-3/60 hover:text-foreground";

export const settingsRailActive = "bg-accent/50 text-accent-foreground font-medium";

export const settingsTileHoverScale =
  "motion-safe:transition-[transform,box-shadow] motion-safe:duration-[var(--dur-fast)] motion-safe:ease-[var(--ease-std)] motion-safe:group-hover/tile:scale-[1.02]";

export const settingsPromoPress =
  "motion-safe:active:scale-[0.99] motion-safe:transition-[transform,background-color,opacity] motion-safe:duration-[var(--dur-fast)]";

export const navRowActive =
  "data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground data-active:font-medium";

export { navLabelWeight };

/** Scope on a menu list when using sliding highlight — row buttons stay transparent on hover. */
export const navMenuGroupScope =
  "[&_[data-sidebar=menu-button]:hover]:not-data-active:bg-transparent [&_[data-sidebar=menu-button]:hover]:not-data-active:text-sidebar-accent-foreground group-data-[proximity]/menu-item:[&_[data-sidebar=menu-button]]:bg-transparent";
