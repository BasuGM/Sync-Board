import { WorkspaceDetail } from '@/components/workspaces/workspace-detail';

export default async function WorkspaceDetailPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  return <WorkspaceDetail workspaceId={workspaceId} />;
}