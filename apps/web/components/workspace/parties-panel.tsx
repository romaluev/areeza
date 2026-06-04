"use client";

import { EmptyState } from "@areeza/ui/components/empty-state";
import type { Party } from "@areeza/core/types";

const roleLabel: Record<Party["role"], string> = {
  plaintiff: "Da'vogar",
  defendant: "Javobgar",
  witness: "Guvoh",
  third_party: "Uchinchi shaxs",
  accomplice: "Hamkor",
};

export function PartiesPanel({ parties }: { parties: Party[] }) {
  if (parties.length === 0) {
    return (
      <EmptyState
        variant="list"
        icon="user"
        title="Tomonlar qo'shilmagan"
        description="Da'vogar, javobgar va boshqa ishtirokchilar suhbatdan keyin paydo bo'ladi."
      />
    );
  }
  return (
    <ul className="divide-y divide-border">
      {parties.map((p) => (
        <li key={p.id} className="px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {roleLabel[p.role]} · {p.kind}
          </p>
          <p className="mt-1 font-medium text-foreground">{p.name}</p>
          {Object.keys(p.requisites).length > 0 ? (
            <dl className="mt-2 space-y-0.5 text-xs text-muted-foreground">
              {Object.entries(p.requisites).map(([k, v]) =>
                v ? (
                  <div key={k}>
                    <span className="font-medium">{k}: </span>
                    {v}
                  </div>
                ) : null,
              )}
            </dl>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
