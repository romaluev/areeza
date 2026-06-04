"use client";

import { useCallback, useState } from "react";
import { Button } from "@areeza/ui/components/button";
import { Segmented } from "@areeza/ui/components/segmented";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@areeza/ui/components/dialog";
import type { AppLocale } from "@/lib/copy";
import { GUIDED_PROMPTS } from "@/lib/intake-copy";
import {
  isFirstRunOnboardingDone,
  markFirstRunOnboardingDone,
} from "@/lib/onboarding-storage";
import { useAppLocale } from "@/lib/use-app-locale";
import { StepIndicator } from "./step-indicator";

const COPY = {
  uz: {
    step1Title: "Til va qisqa yo'riqnoma",
    step1Body:
      "Areeza yuridik maslahat emas — u sud hujjatlarini tayyorlash va tekshirish vositasi. Muammoingizni oddiy tilda yozasiz, biz bir vaqtning o'zida bitta savol beramiz.",
    step2Title: "Misol bilan boshlash",
    step2Body: "Quyidagi tayyor iboradan boshlashingiz yoki o'zingiz yozishingiz mumkin.",
    skip: "O'tkazib yuborish",
    next: "Keyingi",
    start: "Boshlash",
    back: "Orqaga",
  },
  ru: {
    step1Title: "Язык и кратко о сервисе",
    step1Body:
      "Areeza не консультация — это подготовка и проверка судебных документов. Опишите ситуацию простым языком; мы задаём по одному вопросу за раз.",
    step2Title: "Начать с примера",
    step2Body: "Можно выбрать готовую фразу ниже или написать своими словами.",
    skip: "Пропустить",
    next: "Далее",
    start: "Начать",
    back: "Назад",
  },
} as const;

export function FirstRunOnboarding({
  onPickPrompt,
}: {
  onPickPrompt: (text: string) => void;
}) {
  const { locale, setLocale } = useAppLocale();
  const [open, setOpen] = useState(() => !isFirstRunOnboardingDone());
  const [step, setStep] = useState<1 | 2>(1);
  const t = COPY[locale];

  const finish = useCallback(() => {
    markFirstRunOnboardingDone();
    setOpen(false);
  }, []);

  const handleSkip = useCallback(() => {
    finish();
  }, [finish]);

  const handlePick = useCallback(
    (text: string) => {
      onPickPrompt(text);
      finish();
    },
    [finish, onPickPrompt],
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleSkip()}>
      <DialogContent className="max-w-md" showClose={false}>
        <DialogHeader className="items-center text-center sm:text-center">
          <StepIndicator current={step} total={2} locale={locale} className="w-full" />
          <DialogTitle>{step === 1 ? t.step1Title : t.step2Title}</DialogTitle>
          <DialogDescription className="text-pretty">
            {step === 1 ? t.step1Body : t.step2Body}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="flex flex-col gap-4">
            <Segmented<AppLocale>
              value={locale}
              onValueChange={setLocale}
              aria-label={locale === "ru" ? "Язык интерфейса" : "Interfeys tili"}
              options={[
                { value: "uz", label: "O'zbek" },
                { value: "ru", label: "Рус" },
              ]}
            />
            <div className="flex flex-wrap justify-between gap-2">
              <Button type="button" variant="ghost" onClick={handleSkip}>
                {t.skip}
              </Button>
              <Button type="button" variant="brand" onClick={() => setStep(2)}>
                {t.next}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
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
            <div className="flex flex-wrap justify-between gap-2">
              <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                {t.back}
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={handleSkip}>
                  {t.skip}
                </Button>
                <Button type="button" variant="brand" onClick={finish}>
                  {t.start}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
