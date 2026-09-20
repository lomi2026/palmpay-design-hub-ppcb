export default function LoadingEditor() {
  return <main className="px-5 py-8"><header className="editor-page-heading"><h1>编辑内容</h1><p>正在读取草稿…</p></header><section className="mt-6 grid gap-6 rounded-3xl bg-card p-6" aria-busy="true" aria-label="草稿加载中">{[0,1,2].map(value => <div key={value} className="h-24 rounded-xl bg-muted motion-safe:animate-pulse" />)}</section></main>;
}
