import type { SampleStability } from "../report";

interface StabilitySectionProps {
  stability: SampleStability[];
  repeatRunCount: number;
}

const fieldLabels = {
  country: "国家",
  region: "省 / 地区",
  city: "城市",
  attraction: "景点",
} as const;

const confidenceLabels = {
  high: "高",
  medium: "中",
  low: "低",
} as const;

const decisionLabels = {
  confirm: "可确认",
  review: "复核",
  manual: "手动录入",
} as const;

function formatRate(rate: number) {
  return `${Math.round(rate * 100)}%`;
}

function joinValues(values: readonly string[]) {
  return values.map((value) => value).join(" → ");
}

export function StabilitySection({
  stability,
  repeatRunCount,
}: StabilitySectionProps) {
  const callsPerSample = stability.length === 0
    ? 0
    : repeatRunCount / stability.length;
  const stableCount = stability.filter((item) => item.fullyStable).length;

  return (
    <section className="portfolio-band stability-section" id="stability">
      <div className="portfolio-shell">
        <div className="section-heading evaluation-heading-row">
          <div>
            <p>Repeatability check</p>
            <h2>同一张图，模型会不会给出同一个答案？</h2>
            <span>
              稳定性与准确率分开计算。重复输出一致，也可能稳定地答错。
            </span>
          </div>
          <div className="evaluation-summary" aria-label="稳定性测试规模">
            <strong>{stability.length} 个样本 × {callsPerSample} 次调用</strong>
            <span>{stableCount} 个完全稳定</span>
          </div>
        </div>

        <div className="stability-table-wrap">
          <table className="stability-table">
            <thead>
              <tr>
                <th scope="col">样本</th>
                {Object.values(fieldLabels).map((label) => (
                  <th scope="col" key={label}>{label}</th>
                ))}
                <th scope="col">置信度</th>
                <th scope="col">决策</th>
                <th scope="col">结论</th>
              </tr>
            </thead>
            <tbody>
              {stability.map((item) => (
                <tr key={item.sampleId}>
                  <th scope="row">{item.sampleId}</th>
                  {Object.keys(fieldLabels).map((field) => {
                    const metric = item.fields[field as keyof typeof fieldLabels];
                    return (
                      <td key={field}>
                        <strong>{formatRate(metric.consistencyRate)}</strong>
                        <span>
                          {metric.uniqueValues
                            .map((value) => value ?? "空值")
                            .join(" / ")}
                        </span>
                      </td>
                    );
                  })}
                  <td>
                    {joinValues(item.confidenceValues.map(
                      (value) => confidenceLabels[value],
                    ))}
                  </td>
                  <td>
                    {joinValues(item.decisionValues.map(
                      (value) => decisionLabels[value],
                    ))}
                  </td>
                  <td>
                    <span className={item.fullyStable ? "status-stable" : "status-variable"}>
                      {item.fullyStable ? "完全稳定" : "存在波动"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
