'use client';
import Image from 'next/image';
import { ImagePlus, Upload, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { appPath } from '@/lib/app-path';

export function CoverPicker({ name, fileId, disabled, onSelected, autoSubmit = false }: { name: string; fileId?: string | null; disabled?: boolean; onSelected?: (selected: boolean) => void; autoSubmit?: boolean }) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  function select(next: File | null) {
    if (disabled) return;
    if (next && (!['image/png', 'image/jpeg', 'image/webp'].includes(next.type) || next.size > 5 * 1024 * 1024 || !next.size)) {
      setError('请选择不超过 5 MB 的 PNG、JPG 或 WebP 图片。');
      if (input.current) input.current.value = '';
      setFile(null); setPreview(null); onSelected?.(false); return;
    }
    setError(''); setFile(next); setPreview(next ? URL.createObjectURL(next) : null); onSelected?.(Boolean(next));
    if (next && autoSubmit) input.current?.form?.requestSubmit();
  }
  const src = preview ?? (fileId ? appPath(`/api/content-images/${fileId}`) : null);
  return <div className="space-y-3">
    <div className={`group relative rounded-2xl border border-dashed p-4 transition sm:p-6 ${dragging ? 'border-foreground bg-accent' : 'border-border bg-muted/30 hover:border-muted-foreground/60'} ${disabled ? 'pointer-events-none opacity-60' : ''}`} onDragOver={(event) => { event.preventDefault(); if (!disabled) setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); if (disabled) return; const next = event.dataTransfer.files[0]; if (!next) return; const transfer = new DataTransfer(); transfer.items.add(next); if (input.current) input.current.files = transfer.files; select(next); }}>
      <input id={id} ref={input} name={name} type="file" accept="image/png,image/jpeg,image/webp" className="peer sr-only" disabled={disabled} onChange={(event) => select(event.target.files?.[0] ?? null)} aria-describedby={`${id}-help`} />
      <label htmlFor={id} className="flex cursor-pointer flex-col gap-6 rounded-xl outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-4 sm:flex-row sm:items-center">
        <span className="relative flex aspect-[16/10] w-full shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-neutral-200 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500 sm:w-52">{src ? <Image src={src} alt="封面预览" fill unoptimized className="object-cover" sizes="208px" /> : <ImagePlus className="size-9" strokeWidth={1.25} />}</span>
        <span className="min-w-0 space-y-2"><span className="flex items-center gap-2 text-sm font-medium"><Upload className="size-4" />{src ? '点击更换，或拖入新图片' : '点击上传，或将图片拖到这里'}</span><span id={`${id}-help`} className="block text-xs leading-5 text-muted-foreground">PNG、JPG、WebP · 最大 5 MB<br />建议使用横向图片，不上传则显示灰色占位</span>{file ? <span className="block truncate text-xs text-foreground">{file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB</span> : null}</span>
      </label>
    </div>
    {file ? <Button size="sm" variant="ghost" type="button" disabled={disabled} onClick={() => { if (input.current) input.current.value = ''; select(null); }}><X className="size-3.5" />取消选择</Button> : null}
    {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
  </div>;
}
