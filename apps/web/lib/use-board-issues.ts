"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@areeza/core/api";
import type { BoardIssue, Situation } from "@areeza/core/types";

/** Flatten every situation's issues into a single cross-case board list. */
export function flattenBoardIssues(situations: Situation[]): BoardIssue[] {
  return situations.flatMap((s) =>
    (s.issues ?? []).map((issue) => ({
      ...issue,
      situationId: s.id,
      situationTitle: s.title,
    })),
  );
}

export function useBoardIssues() {
  const query = useQuery({
    queryKey: ["situations"],
    queryFn: () => api.listSituations(),
  });

  const issues = useMemo(
    () => (query.data ? flattenBoardIssues(query.data) : []),
    [query.data],
  );

  return {
    issues,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
