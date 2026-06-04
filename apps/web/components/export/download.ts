/** Trigger a browser download; revoke blob URL after click. */
export function downloadBlob(blob: Blob, filename: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    return true;
  } catch {
    return false;
  }
}

/** ASCII-safe filename for zip/pdf (keeps Latin letters and digits). */
export function safeExportFilename(title: string, ext: string): string {
  const base =
    title
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/['ʻʼ`]/g, "")
      .replace(/[^a-zA-Z0-9._-]+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 64) || "areeza_hujjat";
  const suffix = ext.startsWith(".") ? ext : `.${ext}`;
  return `${base}${suffix}`;
}
