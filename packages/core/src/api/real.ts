import type {
  Case,
  CaseDetail,
  CaseSummaryCounts,
  ClassifyRequest,
  ClassifyResponse,
  DraftStreamEvent,
  ExportResponse,
  GeneratedDocument,
  IntakeEvent,
  LegalRoute,
  PipelineStep,
  RegenerateSectionRequest,
  RouteRequest,
  Situation,
  SituationSummaryCounts,
  UpdateDocumentRequest,
  ValidationResult,
} from "../types/index";

function apiBase(): string {
  const url =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL) ||
    "http://localhost:8080";
  return url.replace(/\/$/, "");
}

function wsBase(): string {
  return apiBase().replace(/^http/, "ws");
}

async function fetchJSON<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status} ${path}: ${body || res.statusText}`);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

function openWebSocket(path: string, signal?: AbortSignal): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`${wsBase()}${path}`);
    const onAbort = () => {
      ws.close();
      reject(new Error("Aborted"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
    ws.onopen = () => {
      signal?.removeEventListener("abort", onAbort);
      resolve(ws);
    };
    ws.onerror = () => {
      signal?.removeEventListener("abort", onAbort);
      reject(new Error("WebSocket connection failed"));
    };
  });
}

export async function listSituations(): Promise<Situation[]> {
  try {
    return await fetchJSON<Situation[]>("/api/situations");
  } catch {
    return [];
  }
}

export async function getSituationSummaryCounts(): Promise<SituationSummaryCounts> {
  try {
    return await fetchJSON<SituationSummaryCounts>("/api/situations/summary");
  } catch {
    return { total: 0, intake: 0, ready: 0, draft: 0, inProgress: 0 };
  }
}

export async function getSituation(id: string): Promise<Situation | null> {
  const res = await fetch(`${apiBase()}/api/situations/${encodeURIComponent(id)}`);
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) throw new Error(`API ${res.status} getSituation`);
  return res.json() as Promise<Situation>;
}

export async function deleteSituation(id: string): Promise<void> {
  await fetchJSON<void>(`/api/situations/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function moveIssue(
  situationId: string,
  issueId: string,
  step: PipelineStep,
  position?: number,
): Promise<Situation> {
  return fetchJSON<Situation>(
    `/api/situations/${encodeURIComponent(situationId)}/issues/${encodeURIComponent(issueId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ step, position }),
    },
  );
}

export async function listCases(): Promise<Case[]> {
  return fetchJSON<Case[]>("/api/cases");
}

export async function getCaseSummaryCounts(): Promise<CaseSummaryCounts> {
  return fetchJSON<CaseSummaryCounts>("/api/cases/summary");
}

export async function getCase(id: string): Promise<CaseDetail | null> {
  const res = await fetch(`${apiBase()}/api/cases/${encodeURIComponent(id)}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`API ${res.status} getCase`);
  }
  return res.json() as Promise<CaseDetail>;
}

export async function deleteCase(id: string): Promise<void> {
  await fetchJSON<void>(`/api/cases/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function* streamIntake(
  caseId: string | undefined,
  initialText: string,
  signal?: AbortSignal,
): AsyncGenerator<IntakeEvent> {
  const ws = await openWebSocket("/ws/intake", signal);
  ws.send(JSON.stringify({ situationId: caseId, caseId, text: initialText }));

  const queue: IntakeEvent[] = [];
  let done = false;
  let rejectWait: ((e: Error) => void) | null = null;

  ws.onmessage = (ev) => {
    try {
      const parsed = JSON.parse(String(ev.data)) as IntakeEvent;
      queue.push(parsed);
      if (parsed.type === "done") done = true;
    } catch {
      /* ignore */
    }
  };
  ws.onclose = () => {
    done = true;
    rejectWait?.(new Error("WebSocket closed"));
  };
  ws.onerror = () => {
    rejectWait?.(new Error("WebSocket error"));
  };

  signal?.addEventListener(
    "abort",
    () => {
      ws.close();
    },
    { once: true },
  );

  while (!done || queue.length > 0) {
    if (queue.length > 0) {
      yield queue.shift()!;
      continue;
    }
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(resolve, 50);
      rejectWait = (e) => {
        clearTimeout(t);
        reject(e);
      };
      ws.addEventListener(
        "message",
        () => {
          clearTimeout(t);
          resolve();
        },
        { once: true },
      );
    }).catch((e) => {
      if ((e as Error).message === "Aborted") throw e;
    });
  }
  ws.close();
}

export async function classify(req: ClassifyRequest): Promise<ClassifyResponse> {
  return fetchJSON<ClassifyResponse>("/api/classify", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export async function route(
  req: RouteRequest,
  caseId?: string,
): Promise<LegalRoute> {
  const q = caseId ? `?caseId=${encodeURIComponent(caseId)}` : "";
  return fetchJSON<LegalRoute>(`/api/route${q}`, {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export async function* streamDraft(
  caseId: string,
  docId: string,
  signal?: AbortSignal,
): AsyncGenerator<DraftStreamEvent> {
  const ws = await openWebSocket("/ws/draft", signal);
  ws.send(JSON.stringify({ caseId, documentId: docId }));

  const queue: DraftStreamEvent[] = [];
  let finished = false;

  ws.onmessage = (ev) => {
    const raw = JSON.parse(String(ev.data)) as { type?: string; message?: string };
    if (raw.type === "error") {
      throw new Error(raw.message ?? "draft stream error");
    }
    const parsed = raw as DraftStreamEvent;
    queue.push(parsed);
    if (parsed.type === "done") finished = true;
  };

  signal?.addEventListener("abort", () => ws.close(), { once: true });

  while (!finished || queue.length > 0) {
    if (queue.length > 0) {
      yield queue.shift()!;
      continue;
    }
    await new Promise((r) => setTimeout(r, 40));
  }
  ws.close();
}

export async function regenerateSection(
  req: RegenerateSectionRequest,
): Promise<GeneratedDocument> {
  return fetchJSON<GeneratedDocument>("/api/documents/regenerate", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export async function updateDocument(
  req: UpdateDocumentRequest,
): Promise<GeneratedDocument> {
  return fetchJSON<GeneratedDocument>("/api/documents", {
    method: "PUT",
    body: JSON.stringify(req),
  });
}

export async function draft(caseId: string): Promise<GeneratedDocument> {
  return fetchJSON<GeneratedDocument>("/api/draft", {
    method: "POST",
    body: JSON.stringify({ caseId }),
  });
}

export async function validate(
  caseId: string,
  documentId: string,
): Promise<ValidationResult> {
  return fetchJSON<ValidationResult>("/api/validate", {
    method: "POST",
    body: JSON.stringify({ caseId, documentId }),
  });
}

export async function exportPackage(caseId: string): Promise<ExportResponse> {
  return fetchJSON<ExportResponse>("/api/export", {
    method: "POST",
    body: JSON.stringify({ caseId, situationId: caseId }),
  });
}
