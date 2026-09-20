'use client';

import { appPath } from '@/lib/app-path';
import Image from 'next/image';
import { ImageIcon } from 'lucide-react';
import { useState } from 'react';
export function AssetImage({ fileId, title }: { fileId?: string | null; title: string }) {
  const [failed, setFailed] = useState<string | null>(null);
  return <div className="relative flex h-40 w-full items-center justify-center bg-neutral-200 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-600">
    {fileId && failed !== fileId ? <Image unoptimized fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" src={appPath(`/api/content-images/${fileId}`)} alt={title} onError={() => setFailed(fileId)} /> : <ImageIcon aria-label="暂无封面图片" className="size-10" strokeWidth={1} />}
  </div>;
}
