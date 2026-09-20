import { CachedWorkspacePage } from '@/components/workspace/navigation-cache';
import { PublishedContentDetail } from '@/components/workspace/published-content-detail';
async function Page({params}:{params:Promise<{slug:string}>}) { const {slug}=await params; return <PublishedContentDetail slug={slug} type="DESIGN_ASSET" route="design-assets"/>; }

export default async function CachedDetailPage(props: Parameters<typeof Page>[0]) {
  return <CachedWorkspacePage>{await Page(props)}</CachedWorkspacePage>;
}
