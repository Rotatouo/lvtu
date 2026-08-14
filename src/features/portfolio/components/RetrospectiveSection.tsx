const decisions = [
  ["保留", "图片识别、证据解释、字段核对、会话收藏"],
  ["移出主链路", "路线规划、明信片、游记、3D 地球与社交化展示"],
  ["下一步", "扩充弱线索样本，验证置信度校准和拒答策略"],
];

export function RetrospectiveSection() {
  return (
    <section className="portfolio-band retrospective-section" id="retrospective">
      <div className="portfolio-shell retrospective-grid">
        <div className="section-heading">
          <p>Product retrospective</p>
          <h2>为什么主动删掉大而全。</h2>
          <span>失败样本定义了下一步的产品策略。</span>
        </div>
        <dl>
          {decisions.map(([term, detail]) => (
            <div key={term}>
              <dt>{term}</dt>
              <dd>{detail}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
