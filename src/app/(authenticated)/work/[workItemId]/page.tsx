import { WorkDetail } from "@/components/work/work-detail";

export default async function WorkItemPage({ params }: PageProps<"/work/[workItemId]">) {
  const { workItemId } = await params;
  return <WorkDetail id={workItemId} />;
}
