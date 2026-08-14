import type { ReviewableResult } from "../types";

const confidenceLabels = {
  high: "高置信度",
  medium: "中置信度",
  low: "低置信度",
} as const;

const fieldLabels = {
  country: "国家",
  region: "省级地区",
  city: "城市",
  attraction: "地点",
} as const;

export function InferenceEvidence({ result }: { result: ReviewableResult }) {
  const fields = Object.entries(fieldLabels) as Array<
    [keyof typeof fieldLabels, string]
  >;

  return (
    <section aria-labelledby="inference-evidence-title" className="inference-evidence">
      <div className="evidence-meta">
        <p>{result.mode === "live" ? "实时模型调用" : "真实评测记录"}</p>
        <p>{confidenceLabels[result.ai.confidence]}</p>
      </div>
      <h3 id="inference-evidence-title">模型原始结果</h3>
      <dl className="evidence-fields">
        {fields.map(([key, label]) => (
          <div key={key}>
            <dt>{label}</dt>
            <dd>{result.ai[key] ?? "未识别"}</dd>
          </div>
        ))}
      </dl>
      <p className="evidence-reason">
        <strong>判断依据</strong>
        <span>{result.ai.evidence}</span>
      </p>
    </section>
  );
}
