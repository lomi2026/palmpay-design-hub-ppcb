'use client';

import type { ReactNode } from 'react';
import { WorkspaceResults } from '@/components/workspace/navigation-cache';
import { WorkspaceTabs } from '@/components/workspace/workspace-tabs';

export function PersonalTabs({ activeTab, children }: {
  activeTab: 'favorites' | 'recent';
  children: ReactNode;
}) {
  return <>
    <WorkspaceTabs path="/workspace/favorites" active={activeTab} label="收藏与浏览" items={[["favorites", "我的收藏"], ["recent", "最近浏览"]]} />
    <div className="mt-3"><WorkspaceResults>{children}</WorkspaceResults></div>
  </>;
}
