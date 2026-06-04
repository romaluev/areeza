import { SituationIntakePage } from "@/components/intake/situation-intake-page";

type Props = { searchParams: Promise<{ demo?: string; q?: string; scenario?: string }> };

export default async function NewSituationPage({ searchParams }: Props) {
  const params = await searchParams;
  let seed: string | undefined;
  if (params.scenario === "fraud") {
    seed =
      "Kompaniya mendan 50 million so'm oldi va yo'qoldi. Politsiya harakat qilmayapti.";
  } else if (params.scenario === "workplace") {
    seed =
      "Rahbarim 3 oydan beri oyligimni to'lamayapti, jinsiy bezorilik qildi, ishdan bo'shatdi.";
  } else if (params.scenario === "divorce") {
    seed = "Sobiq turmush o'rtog'im aliment to'lamayapti va kvartiramizni sotmoqchi.";
  } else if (params.demo === "1") {
    seed = "Ish beruvchim 2 oydan beri oyligimni to'lamayapti.";
  } else if (params.q) {
    seed = decodeURIComponent(params.q);
  }
  return <SituationIntakePage seedText={seed} />;
}
