import { CreateWorkspaceForm } from '@/components/workspaces/create-workspace-form';

export default function NewWorkspacePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">New workspace</h1>
      <CreateWorkspaceForm />
    </div>
  );
}