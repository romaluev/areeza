import { SituationWorkspace } from "@/components/workspace/situation-workspace";

type Props = { params: Promise<{ id: string }> };

export default async function SituationPage({ params }: Props) {
  const { id } = await params;
  return <SituationWorkspace situationId={id} />;
}
