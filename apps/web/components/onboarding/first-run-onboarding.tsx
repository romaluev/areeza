"use client";

import { useCallback, useState } from "react";
import { Button } from "@areeza/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@areeza/ui/components/dialog";
import { GUIDED_PROMPTS } from "@/lib/intake-copy";
import {
  isFirstRunOnboardingDone,
  markFirstRunOnboardingDone,
} from "@/lib/onboarding-storage";
import { useAppLocale } from "@/lib/use-app-locale";

const COPY = {
  uz: {
    title: "Areeza qanday ishlaydi",
    body:
      "Areeza yuridik maslahat emas — u sud hujjatlarini tayyorlash va tekshirish vositasi. Muammoingizni oddiy tilda yozasiz, biz bir vaqtning o'zida bitta savol beramiz.",
    examplesHint: "Tayyor iboradan boshlang yoki pastda o'zingiz yozing:",
    skip: "O'tkazib yuborish",
  },
  ru: {
    title: "Как работает Areeza",
    body:
      "Areeza не консультация — это подготовка и проверка судебных документов. Опишите ситуацию простым языком; мы задаём по одному вопросу за раз.",
    examplesHint: "Начните с готовой фразы или напишите своими словами ниже:",
    skip: "Пропустить",
  },
} as const;

export function FirstRunOnboarding({
  onPickPrompt,
}: {
  onPickPrompt: (text: string) => void;
}) {
  const { locale } = useAppLocale();
  const [open, setOpen] = useState(() => !isFirstRunOnboardingDone());
  const t = COPY[locale];

  const finish = useCallback(() => {
    markFirstRunOnboardingDone();
    setOpen(false);
  }, []);

  const handlePick = useCallback(
    (text: string) => {
      onPickPrompt(text);
      finish();
    },
    [finish, onPickPrompt],
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && finish()}>
      <DialogContent className="max-w-md" showClose={false}>
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription className="text-pretty">{t.body}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <p className="text-xs text-muted-foreground">{t.examplesHint}</p>
          <div className="flex flex-col gap-2">
            {GUIDED_PROMPTS[locale].map((p) => (
              <Button
                key={p.id}
                type="button"
                variant="outline"
                className="h-auto min-h-10 whitespace-normal py-2 text-left text-sm"
                onClick={() => handlePick(p.text)}
              >
                {p.text}
              </Button>
            ))}
          </div>
          <div className="flex justify-end">
            <Button type="button" variant="ghost" onClick={finish}>
              {t.skip}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
