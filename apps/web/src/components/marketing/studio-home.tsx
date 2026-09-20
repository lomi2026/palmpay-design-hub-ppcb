import { appPath } from '@/lib/app-path';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowUpRight,
  ArrowRight,
  Layers3,
  Wrench,
  Sparkles,
  Lightbulb,
  BriefcaseBusiness,
  Search,
  MoveUpRight,
} from 'lucide-react';
import { V9ThemeToggle } from './v9-theme-toggle';
const categories = [
  [Layers3, '设计资产', 'design-assets', '让规范随手可用。'],
  [Wrench, 'AI 工具', 'ai-tools', '从工具到实际工作。'],
  [Sparkles, 'AI Skill', 'ai-skills', '让好方法可以复制。'],
  [Lightbulb, 'AI 项目', 'ai-projects', '让下一步有迹可循。'],
  [BriefcaseBusiness, 'AI 案例', 'ai-cases', '让经验拥有依据。'],
] as const;
export function StudioHome() {
  return (
    <div className="v9-source-home studio-home">
      <nav className="studio-home-nav">
        <Link className="studio-brand" href="/">
          <Image src={appPath("/brand/palmpay-logo.svg")} alt="" width={32} height={32} />
          PalmPay <span>Design</span>
        </Link>
        <div>
          <a href="#capabilities">团队能力</a>
          <a href="#how-it-works">如何使用</a>
          <V9ThemeToggle />
          <Link className="studio-primary" href="/workspace">
            进入工作台 <ArrowUpRight size={16} />
          </Link>
        </div>
      </nav>
      <main>
        <section className="studio-home-hero">
          <div className="studio-hero-copy">
            <p className="eyebrow">A SHARED SPACE FOR BETTER DESIGN</p>
            <h1>
              好设计，
              <br />
              不必从零开始。
            </h1>
            <p className="studio-home-lead">
              让设计资产被复用，让设计价值被衡量。
              <br />
              把团队的工具、方法与经验，带进你的下一次创作。
            </p>
            <form action={appPath("/workspace/search")} className="studio-home-search">
              <Search size={18} />
              <input name="q" aria-label="搜索团队内容" placeholder="你今天想解决什么设计问题？" />
              <button type="submit" aria-label="搜索">
                <ArrowRight size={20} />
              </button>
            </form>
            <div className="studio-hero-links">
              <Link href="/workspace/design-assets">
                找设计资产 <ArrowUpRight size={15} />
              </Link>
              <Link href="/workspace/ai-skills">
                用 AI 方法 <ArrowUpRight size={15} />
              </Link>
            </div>
          </div>
          <div className="studio-hero-board">
            <div className="studio-board-top">
              <span>DESIGN, TOGETHER.</span>
              <Sparkles size={20} />
            </div>
            <div className="studio-board-title">
              一个人的经验。
              <br />
              <span>整个团队的起点。</span>
            </div>
            <Link className="studio-board-card board-lime" href="/workspace/ai-tools">
              <Wrench size={23} />
              <div>
                <small>01 / TOOLKIT</small>
                <h2>让工具成为助力</h2>
                <p>找到适合当前任务的 AI 工具</p>
              </div>
              <ArrowUpRight size={22} />
            </Link>
            <Link className="studio-board-card board-purple" href="/workspace/ai-skills">
              <Sparkles size={23} />
              <div>
                <small>02 / METHODS</small>
                <h2>让方法可以复用</h2>
                <p>明确输入、执行与人工判断</p>
              </div>
              <ArrowUpRight size={22} />
            </Link>
            <Link className="studio-board-card board-white" href="/workspace/ai-cases">
              <BriefcaseBusiness size={23} />
              <div>
                <small>03 / PRACTICE</small>
                <h2>让实践沉淀下来</h2>
                <p>记录结果，也记录边界</p>
              </div>
              <ArrowUpRight size={22} />
            </Link>
            <div className="studio-board-bottom">
              Designed for the way we work.
              <MoveUpRight size={18} />
            </div>
          </div>
        </section>
        <section id="capabilities" className="studio-capabilities">
          <header>
            <div>
              <p className="eyebrow">OUR COLLECTIVE TOOLKIT</p>
              <h2>从想法，到可用的能力。</h2>
            </div>
            <p>五种内容，一条从发现到复用的路径。</p>
          </header>
          <div>
            {categories.map(([Icon, label, path, description], i) => (
              <Link href={`/workspace/${path}`} key={path}>
                <span>0{i + 1}</span>
                <Icon size={27} />
                <h3>{label}</h3>
                <p>{description}</p>
                <ArrowUpRight size={20} />
              </Link>
            ))}
          </div>
        </section>
        <section id="how-it-works" className="studio-home-process">
          <div>
            <p className="eyebrow">MAKE GOOD WORK GO FURTHER</p>
            <h2>
              让一次好实践，
              <br />
              拥有更长的生命。
            </h2>
            <Link className="studio-primary" href="/workspace/submit">
              分享我的经验 <ArrowUpRight size={17} />
            </Link>
          </div>
          <ol>
            {[
              ['找到方法', '按内容类型、分类与关键词，找到当前任务可用的工具和经验。'],
              ['在真实任务中使用', '确认输入要求与适用范围，结合设计师的判断完成工作。'],
              ['留下可复用的成果', '记录做法、边界与验证结果，发布后让团队直接发现和使用。'],
            ].map(([title, description], i) => (
              <li key={title}>
                <span>0{i + 1}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </main>
      <footer>
        <span>PalmPay Design · 团队的设计能力，共同生长。</span>
        <Link href="/workspace">
          开始探索 <ArrowUpRight size={16} />
        </Link>
      </footer>
    </div>
  );
}
