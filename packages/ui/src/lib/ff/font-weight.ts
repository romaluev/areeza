// Inter (variable) weight tokens for `fontVariationSettings`, used by the
// vendored Fluid Functionalism components for width-stable weight animation.
// Each weight pairs `wght` with an optical-size (`opsz`) so animating between
// weights keeps the text's advance width nearly constant.
export const fontWeights = {
  normal: "'wght' 400, 'opsz' 14",
  medium: "'wght' 450, 'opsz' 15",
  semibold: "'wght' 550, 'opsz' 20",
  bold: "'wght' 700, 'opsz' 25",
} as const;
