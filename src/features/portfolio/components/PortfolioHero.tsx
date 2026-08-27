import Image from "next/image";

import { TravelPath } from "./TravelPath";

export function PortfolioHero() {
  return (
    <header className="portfolio-hero" id="project">
      <Image
        alt="桂林漓江的山水与游船"
        className="portfolio-hero-image"
        fill
        loading="eager"
        priority
        sizes="100vw"
        src="/portfolio/samples/sample-01.webp"
      />
      <div className="portfolio-hero-shade" />
      <div className="portfolio-hero-inner">
        <div className="portfolio-kicker">AI 产品案例 · 2026</div>
        <h1>旅途</h1>
        <h2>把散落的旅行截图，变成可确认的目的地收藏。</h2>
        <p className="portfolio-hero-summary">
          我把一次“看见想去，却懒得整理”的真实困扰，收缩成识别、解释、核对、收藏四步闭环。
          我据此划定自动确认边界，并把不确定或冲突的结果交还给人。
        </p>
        <div className="portfolio-hero-actions">
          <a className="primary-action" href="#experience">进入可交互 Demo</a>
          <a className="text-action" href="#evaluation">查看真实评测结果</a>
        </div>
        <TravelPath />
      </div>
      <div className="portfolio-hero-caption">桂林漓江 · 回放样本 01</div>
    </header>
  );
}
