export const PIPELINE_STEPS = [
  { id: "describe", label: "Tasvirlang" },
  { id: "classify", label: "Tasniflang" },
  { id: "route", label: "Yo'naltiring" },
  { id: "prepare", label: "Tayyorlang" },
  { id: "validate", label: "Tekshiring" },
  { id: "submit", label: "Topshiring" },
] as const;

export const STATUS_LABELS: Record<string, string> = {
  draft: "Qoralama",
  intake: "Murojaat",
  classified: "Tasniflangan",
  routed: "Marshrut",
  drafted: "Hujjat tayyor",
  validated: "Tekshirilgan",
  ready: "Topshirishga tayyor",
};

export const COMPLIANCE_NOTE =
  "Areeza yuridik maslahat bermaydi. U yo'naltirish, tayyorlash va tekshirish vositasi; topshirish qarori fuqaroning o'zida qoladi.";
