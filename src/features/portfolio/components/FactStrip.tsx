export function FactStrip({ evidenceCallCount }: { evidenceCallCount: number }) {
  const facts = [
    ["模型", "qwen-vl-plus"],
    ["当前证据", `${evidenceCallCount} 次真实调用`],
    ["决策分支", "确认 / 复核 / 手动"],
    ["数据写入", "仅本次浏览会话"],
  ];

  return (
    <section aria-label="项目事实" className="fact-strip">
      <div className="portfolio-shell fact-strip-grid">
        {facts.map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
