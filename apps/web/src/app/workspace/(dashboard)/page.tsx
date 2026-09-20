import { CachedWorkspacePage } from '@/components/workspace/navigation-cache';
import { StudioDashboard } from '@/components/workspace/studio-dashboard';

function WorkspacePage() {
  return <StudioDashboard />;
}

export default async function CachedPage() {
  return <CachedWorkspacePage>{await WorkspacePage()}</CachedWorkspacePage>;
}
