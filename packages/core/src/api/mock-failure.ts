const STORAGE_KEY = "areeza-mock-fail";

/** Arm the next call(s) to named mock operations to throw (demo / QA). Client-only. */
export function armMockFailures(...operations: string[]): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(operations));
}

export function clearMockFailures(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}

/** Throws a friendly demo error when this operation was armed. */
export function maybeThrowMockFailure(operation: string): void {
  if (typeof sessionStorage === "undefined") return;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  let ops: string[];
  try {
    ops = JSON.parse(raw) as string[];
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
    return;
  }
  if (!ops.includes(operation)) return;
  const next = ops.filter((o) => o !== operation);
  if (next.length) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  else sessionStorage.removeItem(STORAGE_KEY);
  throw new Error("Vaqtinchalik xatolik (demo). Qayta urinib ko'ring.");
}

export function isMockFailureError(err: unknown): boolean {
  return err instanceof Error && err.message.includes("Vaqtinchalik xatolik");
}
