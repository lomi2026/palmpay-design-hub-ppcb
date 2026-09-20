'use client';

import { LogOut } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { DropdownMenu } from 'radix-ui';
import { useFormStatus } from 'react-dom';
import { logout } from '@/app/login/actions';

const itemClass = 'flex w-full cursor-pointer items-center gap-2 rounded-[10px] px-3 py-2 text-sm text-[var(--v9-text)] outline-none focus:bg-[var(--v9-soft-hover)] data-[highlighted]:bg-[var(--v9-soft-hover)]';

function LogoutItem() {
  const { pending } = useFormStatus();
  return <DropdownMenu.Item asChild disabled={pending} onSelect={(event) => event.preventDefault()}>
    <button type="submit" className={itemClass} disabled={pending}><LogOut className="size-4" />{pending ? '正在退出…' : '退出登录'}</button>
  </DropdownMenu.Item>;
}

export function WorkspaceAccountMenu({ name, email, roleLabel }: { name: string; email: string; roleLabel: string }) {
  const displayName = name.trim();
  const words = displayName.split(/\s+/).filter(Boolean);
  const initials = Array.from(
    words.length > 1 && !/\p{Script=Han}/u.test(displayName)
      ? `${Array.from(words[0] ?? '')[0] ?? ''}${Array.from(words[words.length - 1] ?? '')[0] ?? ''}`
      : displayName || '用户',
  ).slice(0, 2).join('').toLocaleUpperCase();
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openedByHover = useRef(false);
  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 180);
  };
  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);

  return <DropdownMenu.Root modal={false} open={open} onOpenChange={(value) => { cancelClose(); setOpen(value); }}>
    <DropdownMenu.Trigger asChild>
      <button
        aria-label="账号菜单"
        className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-[12px] bg-[var(--v9-raised)] text-[11px] font-bold text-[var(--v9-text)] outline-none transition hover:bg-[var(--v9-soft-hover)] focus-visible:ring-2 focus-visible:ring-[var(--v9-text)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--v9-bg)]"
        type="button"
        onPointerEnter={(event) => { if (event.pointerType === 'mouse') { cancelClose(); if (!open) { openedByHover.current = true; setOpen(true); } } }}
        onPointerLeave={(event) => { if (event.pointerType === 'mouse') scheduleClose(); }}
        onPointerDown={(event) => { cancelClose(); if (open && openedByHover.current) { event.preventDefault(); openedByHover.current = false; } }}
      >{initials}</button>
    </DropdownMenu.Trigger>
    <DropdownMenu.Portal>
      <DropdownMenu.Content
        align="end" sideOffset={8}
        className="z-50 w-64 max-w-[calc(100vw-2rem)] rounded-[12px] border border-[var(--v9-line)] bg-[var(--v9-panel-2)] p-1 shadow-xl"
        onPointerEnter={cancelClose}
        onPointerLeave={(event) => { if (event.pointerType === 'mouse') scheduleClose(); }}
        onCloseAutoFocus={(event) => { if (openedByHover.current) event.preventDefault(); openedByHover.current = false; }}
      >
        <DropdownMenu.Label className="px-3 py-3">
          <p className="text-sm font-semibold text-[var(--v9-text)]">{name}</p>
          <p className="mt-2 text-xs font-normal text-[var(--v9-subtle)]">登录邮箱</p>
          <p className="mt-1 break-all text-sm font-normal text-[var(--v9-text)]">{email}</p>
          <p className="mt-2 text-xs font-normal text-[var(--v9-muted)]">角色：{roleLabel}</p>
        </DropdownMenu.Label>
        <DropdownMenu.Separator className="mx-2 my-1 h-px bg-[var(--v9-line)]" />
        <form action={logout}><LogoutItem /></form>
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  </DropdownMenu.Root>;
}
