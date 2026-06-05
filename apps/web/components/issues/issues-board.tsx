"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  closestCenter,
  type CollisionDetection,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import type { BoardIssue, PipelineStep } from "@areeza/core/types";
import type { AppLocale } from "@/lib/copy";
import { BOARD_STAGES, SEVERITY_CONFIG } from "./stage-config";
import { BoardColumn } from "./board-column";
import { BoardCardContent } from "./board-card";

type Columns = Record<PipelineStep, string[]>;

const COLUMN_IDS = new Set<string>(BOARD_STAGES);

const kanbanCollision: CollisionDetection = (args) => {
  const pointer = pointerWithin(args);
  if (pointer.length > 0) {
    const cards = pointer.filter((c) => !COLUMN_IDS.has(c.id as string));
    if (cards.length > 0) return cards;
  }
  return closestCenter(args);
};

/** Default ordering within a column: manual position, then severity, then title. */
function sortIssues(issues: BoardIssue[]): BoardIssue[] {
  return [...issues].sort((a, b) => {
    if (a.position != null && b.position != null) return a.position - b.position;
    if (a.position != null) return -1;
    if (b.position != null) return 1;
    const sev = SEVERITY_CONFIG[b.severity].bars - SEVERITY_CONFIG[a.severity].bars;
    if (sev !== 0) return sev;
    return a.title.localeCompare(b.title);
  });
}

function buildColumns(issues: BoardIssue[]): Columns {
  const cols = {} as Columns;
  for (const step of BOARD_STAGES) {
    cols[step] = sortIssues(issues.filter((i) => i.step === step)).map((i) => i.id);
  }
  return cols;
}

function findColumn(cols: Columns, id: string): PipelineStep | null {
  if (BOARD_STAGES.includes(id as PipelineStep)) return id as PipelineStep;
  for (const step of BOARD_STAGES) {
    if (cols[step].includes(id)) return step;
  }
  return null;
}

function computePosition(ids: string[], activeId: string, map: Map<string, BoardIssue>): number {
  const idx = ids.indexOf(activeId);
  if (idx === -1) return 0;
  const pos = (id: string) => map.get(id)?.position ?? 0;
  if (ids.length === 1) return map.get(activeId)?.position ?? 0;
  if (idx === 0) return pos(ids[1]!) - 1;
  if (idx === ids.length - 1) return pos(ids[idx - 1]!) + 1;
  return (pos(ids[idx - 1]!) + pos(ids[idx + 1]!)) / 2;
}

export function IssuesBoard({
  issues,
  locale,
  onMoveIssue,
}: {
  issues: BoardIssue[];
  locale: AppLocale;
  /** Called on drop with the new stage + computed float position. */
  onMoveIssue: (
    issueId: string,
    situationId: string,
    step: PipelineStep,
    position: number,
  ) => void;
}) {
  const [activeIssue, setActiveIssue] = useState<BoardIssue | null>(null);
  const isDraggingRef = useRef(false);

  const [columns, setColumns] = useState<Columns>(() => buildColumns(issues));
  const columnsRef = useRef(columns);
  columnsRef.current = columns;

  useEffect(() => {
    if (!isDraggingRef.current) setColumns(buildColumns(issues));
  }, [issues]);

  // Lock for one frame after a cross-column move so collision detection settles.
  const recentlyMovedRef = useRef(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      recentlyMovedRef.current = false;
    });
    return () => cancelAnimationFrame(id);
  }, [columns]);

  const issueMap = useMemo(() => {
    const map = new Map<string, BoardIssue>();
    for (const i of issues) map.set(i.id, i);
    return map;
  }, [issues]);
  const issueMapRef = useRef(issueMap);
  if (!isDraggingRef.current) issueMapRef.current = issueMap;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    isDraggingRef.current = true;
    setActiveIssue(issueMapRef.current.get(event.active.id as string) ?? null);
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || recentlyMovedRef.current) return;
    const activeId = active.id as string;
    const overId = over.id as string;
    setColumns((prev) => {
      const activeCol = findColumn(prev, activeId);
      const overCol = findColumn(prev, overId);
      if (!activeCol || !overCol || activeCol === overCol) return prev;
      recentlyMovedRef.current = true;
      const oldIds = prev[activeCol].filter((id) => id !== activeId);
      const newIds = [...prev[overCol]];
      const overIndex = newIds.indexOf(overId);
      newIds.splice(overIndex >= 0 ? overIndex : newIds.length, 0, activeId);
      return { ...prev, [activeCol]: oldIds, [overCol]: newIds };
    });
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      isDraggingRef.current = false;
      setActiveIssue(null);
      const reset = () => setColumns(buildColumns(issues));
      if (!over) return reset();

      const activeId = active.id as string;
      const overId = over.id as string;
      const cols = columnsRef.current;
      const activeCol = findColumn(cols, activeId);
      const overCol = findColumn(cols, overId);
      if (!activeCol || !overCol) return reset();

      let finalColumns = cols;
      if (activeCol === overCol) {
        const ids = cols[activeCol];
        const oldIndex = ids.indexOf(activeId);
        const newIndex = ids.indexOf(overId);
        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          finalColumns = { ...cols, [activeCol]: arrayMove(ids, oldIndex, newIndex) };
          setColumns(finalColumns);
        }
      }

      const finalCol = findColumn(finalColumns, activeId);
      if (!finalCol) return reset();

      const map = issueMapRef.current;
      const finalIds = finalColumns[finalCol];
      const newPosition = computePosition(finalIds, activeId, map);
      const issue = map.get(activeId);
      if (!issue) return reset();
      if (issue.step === finalCol && issue.position === newPosition) return;

      onMoveIssue(activeId, issue.situationId, finalCol, newPosition);
    },
    [issues, onMoveIssue],
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={kanbanCollision}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto p-4">
        {BOARD_STAGES.map((step) => (
          <BoardColumn
            key={step}
            step={step}
            issueIds={columns[step] ?? []}
            issueMap={issueMapRef.current}
            locale={locale}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeIssue ? (
          <div className="w-[272px] rotate-2 cursor-grabbing opacity-95 shadow-lg shadow-black/10">
            <BoardCardContent issue={activeIssue} locale={locale} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
