const branches = [
  { count: "2 / 6", label: "可确认", note: "核心地点语义一致，具体字段仍由人确认" },
  { count: "2 / 6", label: "需复核", note: "地点粒度偏差或城市字段缺失" },
  { count: "2 / 6", label: "手动录入", note: "弱线索下出现高置信度错判" },
];

export function EvaluationPreview() {
  return (
    <section className="portfolio-band evaluation-preview" id="evaluation">
      <div className="portfolio-shell">
        <div className="section-heading">
          <p>Exploratory evaluation</p>
          <h2>评测结果决定自动化边界与人工确认策略。</h2>
          <span>当前展示 6 张探索性样本；30 张分层评测集将在下一阶段扩充。</span>
        </div>
        <div className="evaluation-grid">
          {branches.map((branch) => (
            <article key={branch.label}>
              <strong>{branch.count}</strong>
              <h3>{branch.label}</h3>
              <p>{branch.note}</p>
            </article>
          ))}
        </div>
        <div className="badcase-callout">
          <span>已验证 Badcase</span>
          <p>成都普通街景被高置信度判断为上海；桂林中山中路被判断为广州北京路。</p>
          <strong>高置信度不能单独成为自动写入条件。</strong>
        </div>
      </div>
    </section>
  );
}
