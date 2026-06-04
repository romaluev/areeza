/** Inter variable font weight shift (FF nav / active controls). */

export const fontWeightTransition =
  "transition-[font-variation-settings,font-weight] duration-[120ms] ease-out";

export const navLabelWeight =
  "font-normal data-active:font-medium transition-[font-weight] duration-[120ms] ease-out";

export const interactiveWeight =
  "font-normal hover:font-medium data-[state=active]:font-medium";

export function fontWeightClass(active: boolean): string {
  return active ? "font-medium" : "font-normal";
}
