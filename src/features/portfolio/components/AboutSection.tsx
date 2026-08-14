import { ArrowUpRight, Code2 } from "lucide-react";

export function AboutSection() {
  return (
    <footer className="about-section" id="about">
      <div className="portfolio-shell about-grid">
        <div>
          <p className="section-label">About the work</p>
          <h2>一个项目，也可以展示完整的产品判断。</h2>
        </div>
        <div className="about-copy">
          <p>
            我提出了旅途的初始问题与基础功能，并在 AI 编程协作下完成实现。
            本次重塑由我负责问题定义、范围取舍、人工确认策略、评测口径与验收，不把 AI 生成代码包装成独立开发经历。
          </p>
          <div className="about-links">
            <a href="https://github.com/Rotatouo/lvtu" rel="noreferrer" target="_blank">
              <Code2 aria-hidden="true" size={18} /> GitHub <ArrowUpRight aria-hidden="true" size={15} />
            </a>
            <a href="https://lvtu-kueq.vercel.app/" rel="noreferrer" target="_blank">
              原始在线版本 <ArrowUpRight aria-hidden="true" size={15} />
            </a>
          </div>
        </div>
      </div>
      <div className="portfolio-shell portfolio-footer-line">
        <span>旅途 · AI 产品经理求职案例</span>
        <span>深圳 · 2026</span>
      </div>
    </footer>
  );
}
