const aiTasks = ["从图片提取地点字段", "返回置信度与判断依据", "给出坐标与可选开放信息"];
const humanTasks = ["判断识别粒度是否适合收藏", "修正错位、缺失与过度推断字段", "确认后才进入本次收藏"];

export function RoleSection() {
  return (
    <section className="portfolio-band role-section" id="roles">
      <div className="portfolio-shell">
        <div className="section-heading">
          <p>Responsibility map</p>
          <h2>AI 做了什么，我做了什么。</h2>
          <span>系统按字段和决策结果分层，人保留最终确认权。</span>
        </div>
        <div className="role-grid">
          <article>
            <div className="role-index">01</div>
            <h3>AI 提供候选判断</h3>
            <ul>{aiTasks.map((task) => <li key={task}>{task}</li>)}</ul>
          </article>
          <article>
            <div className="role-index">02</div>
            <h3>用户完成最终决策</h3>
            <ul>{humanTasks.map((task) => <li key={task}>{task}</li>)}</ul>
          </article>
        </div>
      </div>
    </section>
  );
}
