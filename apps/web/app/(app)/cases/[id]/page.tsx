import { CaseWorkspace } from "@/components/workspace/case-workspace";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CaseDetailPage({ params }: Props) {
  const { id } = await params;
  return <CaseWorkspace caseId={id} />;
}
