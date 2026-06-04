import { Font } from "@react-pdf/renderer";

const FONT_URL = "/fonts/EBGaramond-Variable.ttf";
const FONT_FAMILY = "EBGaramond";

let registerPromise: Promise<void> | null = null;

/** Register Unicode serif (Latin + Cyrillic) once for @react-pdf/renderer. */
export function ensurePdfFont(): Promise<void> {
  if (registerPromise) return registerPromise;

  registerPromise = (async () => {
    Font.register({
      family: FONT_FAMILY,
      fonts: [
        { src: FONT_URL, fontWeight: 400 },
        { src: FONT_URL, fontWeight: 700 },
      ],
    });
  })();

  return registerPromise;
}

export const PDF_FONT_FAMILY = FONT_FAMILY;
