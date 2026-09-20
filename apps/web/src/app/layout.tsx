import { RouteTheme } from '@/components/marketing/route-theme';
import { LocalizedValidation } from '@/components/localized-validation';
import type { Metadata } from 'next';
import './globals.css';
import './hub-design.css';
import './workspace-spacing.css';
import './component-states.css';
import './component-radius.css';

export const metadata: Metadata = {
  title: 'PalmPay体验设计Hub',
  description: 'PalmPay Design Intelligence Hub',
};

const themeBootstrap = `(()=>{const studio=location.pathname.replace(new RegExp('^/apps/[^/]+'),'')==='/workspace'||location.pathname.replace(new RegExp('^/apps/[^/]+'),'').startsWith('/workspace/');const root=document.documentElement;root.dataset.design=studio?'studio':'refined';let theme='dark';try{const saved=localStorage.getItem('ppux-theme');if(saved==='light'||saved==='dark')theme=saved}catch{}root.classList.toggle('dark',theme==='dark');root.style.colorScheme=theme})()`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning data-design="refined" className="dark">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body suppressHydrationWarning>
        <RouteTheme />
        <LocalizedValidation />
        {children}
      </body>
    </html>
  );
}
