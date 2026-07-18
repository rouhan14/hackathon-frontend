import { AssistantWorkspace } from "@/components/assistant/assistant-workspace";

export default async function AssistantThreadPage({ params }: PageProps<"/assistant/[threadId]">) {
  const { threadId } = await params;
  return <AssistantWorkspace threadId={threadId} />;
}
