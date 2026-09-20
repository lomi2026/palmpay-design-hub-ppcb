import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function UnauthorizedPage() {
  return (
    <main className="v9-source-home grid min-h-screen place-items-center bg-[var(--v9-bg)] px-6 text-center text-[var(--v9-text)]">
      <section className="relative overflow-hidden rounded-[24px] border border-[var(--v9-line)] bg-[var(--v9-panel)] p-9 shadow-2xl shadow-black/30">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--v9-grid-line)_1px,transparent_1px),linear-gradient(var(--v9-grid-line)_1px,transparent_1px)] bg-[size:48px_48px] opacity-35" />
        <div className="relative">
        <h1 className="text-[34px] font-semibold tracking-[-.055em] text-white">无权访问此页面</h1>
        <p className="mt-2 text-white/55">请联系平台管理员确认账号状态与角色范围。</p>
        <Button asChild variant="outline" className="mt-6 border-white/15 bg-white/[.04] text-white hover:bg-white/10 hover:text-white"><Link href="/">返回首页</Link></Button>
        </div>
      </section>
    </main>
  );
}
