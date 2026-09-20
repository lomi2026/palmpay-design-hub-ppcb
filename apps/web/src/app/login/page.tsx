import Link from 'next/link';
import { appPath } from '@/lib/app-path';
import { loadCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { developmentLogin, testLogin } from './actions';
import { Input } from '@/components/ui/input';
import { LoginServiceStatus, LoginSubmitButton } from './login-status';

const errorMessages: Record<string, string> = {
  'invalid-email': '请输入有效的企业邮箱。',
  'user-unavailable': '用户不存在、未启用或已被禁用。',
  'invalid-credentials': '邮箱无效，或该测试账号尚未启用。',
  'service-unavailable': '认证服务正在启动或暂时不可用，请稍候重试。',
  'session-expired': '登录已失效，或该用户已不可用，请重新登录。',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const isTestMode = process.env.AUTH_MODE === 'test';
  if (process.env.AUTH_MODE === 'ppcb') {
    const user = await loadCurrentUser();
    if (user) redirect('/workspace');
    return <main className="grid min-h-screen place-items-center bg-background p-8 text-foreground"><section className="max-w-md space-y-5 rounded-2xl bg-card p-8"><h1 className="text-2xl font-semibold">钉钉登录</h1><p>请使用已获授权的钉钉账号进入。若仍无法访问，请联系应用管理员检查账号状态。</p><a className="inline-block rounded-lg bg-primary px-4 py-2 text-primary-foreground" href={`/api/auth/dingtalk/start?returnTo=${encodeURIComponent(appPath('/workspace'))}`}>使用钉钉登录</a></section></main>;
  }

  return (
    <main className="v9-source-home grid min-h-screen place-items-center bg-[var(--v9-bg)] px-6 py-12 text-[var(--v9-text)]">
      <section className="relative w-full max-w-[560px] overflow-hidden rounded-[24px] border border-[var(--v9-line)] bg-[var(--v9-panel)] p-7 shadow-2xl shadow-black/30 sm:p-10">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--v9-grid-line)_1px,transparent_1px),linear-gradient(var(--v9-grid-line)_1px,transparent_1px)] bg-[size:48px_48px] opacity-35" />
        <div className="relative">
        <h1 className="text-[34px] font-semibold tracking-[-.055em] text-white">登录体验设计中心</h1>
        <p className="mt-2 text-sm leading-6 text-white/55">
          {isTestMode
            ? '测试环境仅允许已启用成员使用企业邮箱登录。正式环境接入企业 SSO 后将替换此表单。'
            : '当前为隔离的开发认证入口。正式环境接入企业 SSO 后将替换此表单。'}
        </p>

        {isTestMode ? <LoginServiceStatus /> : null}

        <form action={isTestMode ? testLogin : developmentLogin} className="mt-8 space-y-4">
          <label className="block text-sm text-white/75" htmlFor="email">
            企业邮箱
          </label>
          <Input
            autoComplete="email"
            className="h-11 w-full border-[var(--v9-line-strong)] bg-[var(--v9-field)] text-[var(--v9-text)] placeholder:text-[var(--v9-subtle)]"
            id="email"
            name="email"
            placeholder="name@palmpay.com"
            required
            type="email"
          />
          {error ? (
            <p role="alert" className="text-sm text-destructive">{errorMessages[error] ?? '登录失败，请重试。'}</p>
          ) : null}
          <LoginSubmitButton />
        </form>

        <Link className="mt-7 inline-flex text-sm text-white/45 transition hover:text-white/75" href="/">
          返回公开首页
        </Link>
        </div>
      </section>
    </main>
  );
}
