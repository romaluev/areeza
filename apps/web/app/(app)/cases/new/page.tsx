import { IntakeFlow } from "@/components/intake/intake-flow";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ demo?: string; q?: string }>;
};

export default async function NewCasePage({ searchParams }: Props) {
  const params = await searchParams;
  const seed =
    params.demo === "1"
      ? "Ish beruvchim 2 oydan beri oyligimni to'lamayapti."
      : params.q
        ? decodeURIComponent(params.q)
        : undefined;

  return <IntakeFlow seedText={seed} />;
}
