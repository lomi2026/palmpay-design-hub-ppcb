'use client';
import { showActionFeedback } from './action-feedback';

import { Copy } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function CopyTextButton({ text, label = '复制内容' }: { text: string; label?: string }) {

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      showActionFeedback('success', '内容已复制');
    } catch {
      showActionFeedback('error', '复制失败，请重试。');
    }
  }

  return (
    <Button
      aria-label={label}
      className="h-9 border-white/[.14] bg-white/[.05] px-3 text-[12px] text-white hover:bg-white/[.12] hover:text-white"
      onClick={copy}
      type="button"
      variant="outline"
    >
      <Copy className="size-3.5" />
      {label}
    </Button>
  );
}
