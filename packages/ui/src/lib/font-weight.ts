/** Inter variable font weight shift (FF nav / active controls). */

export const fontWeightTransition =
  "transition-[font-variation-settings,font-weight] duration-[var(--dur-fast)] ease-[var(--ease-std)]";

/** Label weight shift on active nav rows (FF tactile cue). */
export const navLabelWeight =
  "font-normal data-active:font-medium transition-[font-weight] duration-[var(--dur-fast)] ease-[var(--ease-std)]";

export const interactiveWeight =
  "font-normal hover:font-medium data-[state=active]:font-medium";

export function fontWeightClass(active: boolean): string {
  return active ? "font-medium" : "font-normal";
}
