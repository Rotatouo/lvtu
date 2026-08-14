"use client";

import type { KeyboardEvent } from "react";
import { useState } from "react";

import type { Badcase } from "../badcases";
import type { EvaluationRun } from "../run-records";
import type { ExpectedLocation } from "../types";

interface BadcaseSectionProps {
  badcases: readonly Badcase[];
  retestRuns: readonly EvaluationRun[];
}

type LocationField = keyof ExpectedLocation;

const LOCATION_FIELDS: Array<{
  field: LocationField;
  label: string;
}> = [
  { field: "country", label: "国家" },
  { field: "region", label: "地区" },
  { field: "city", label: "城市" },
  { field: "attraction", label: "景点" },
];

const CATEGORY_LABELS: Record<Badcase["category"], string> = {
  "text-prior-conflict": "文字先验冲突",
  "ocr-geography-drift": "OCR 地理漂移",
  "landmark-granularity": "地标粒度偏差",
  "weak-over-inference": "弱线索过度推断",
};

const DECISION_LABELS: Record<EvaluationRun["decision"], string> = {
  confirm: "可确认",
  review: "需复核",
  manual: "手动录入",
};

const CONFIDENCE_LABELS: Record<
  EvaluationRun["output"]["confidence"],
  string
> = {
  high: "高",
  medium: "中",
  low: "低",
};

const WRAP_STYLE = { minWidth: 0, overflowWrap: "anywhere" } as const;

function displayValue(value: string | null) {
  return value ?? "不可辨识";
}

export function BadcaseSection({ badcases, retestRuns }: BadcaseSectionProps) {
  const [selectedId, setSelectedId] = useState<Badcase["id"] | null>(
    badcases[0]?.id ?? null,
  );
  const selected =
    badcases.find((badcase) => badcase.id === selectedId) ?? badcases[0];

  const retestRunsById = new Map(retestRuns.map((run) => [run.runId, run]));
  const selectedRetestRuns = selected
    ? selected.retestRunIds
        .map((runId) => retestRunsById.get(runId))
        .filter((run): run is EvaluationRun => run !== undefined)
    : [];

  function moveTabFocus(
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) {
    let targetIndex: number;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      targetIndex = (currentIndex + 1) % badcases.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      targetIndex = (currentIndex - 1 + badcases.length) % badcases.length;
    } else if (event.key === "Home") {
      targetIndex = 0;
    } else if (event.key === "End") {
      targetIndex = badcases.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    const target = badcases[targetIndex];
    setSelectedId(target.id);
    const tabs = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
      '[role="tab"]',
    );
    tabs?.[targetIndex]?.focus();
  }

  return (
    <section
      aria-labelledby="badcase-section-title"
      className="evaluation-section badcase-section"
    >
      <header className="evaluation-section-heading">
        <p>Badcase review</p>
        <h2 id="badcase-section-title">错误案例与复测证据</h2>
      </header>

      {selected ? (
        <>
          <div
            aria-label="错误案例"
            className="badcase-selector"
            role="tablist"
          >
            {badcases.map((badcase, index) => {
              const isSelected = badcase.id === selected.id;
              return (
                <button
                  aria-controls={`badcase-panel-${badcase.id}`}
                  aria-selected={isSelected}
                  className="badcase-selector-item"
                  id={`badcase-tab-${badcase.id}`}
                  key={badcase.id}
                  onClick={() => setSelectedId(badcase.id)}
                  onKeyDown={(event) => moveTabFocus(event, index)}
                  role="tab"
                  tabIndex={isSelected ? 0 : -1}
                  type="button"
                >
                  <span>案例 {index + 1}</span>
                  <strong>{badcase.sampleId}</strong>
                  <small>{CATEGORY_LABELS[badcase.category]}</small>
                </button>
              );
            })}
          </div>

          <div
            aria-labelledby={`badcase-tab-${selected.id}`}
            className="badcase-detail"
            id={`badcase-panel-${selected.id}`}
            role="tabpanel"
          >
            <div
              aria-label={`${selected.sampleId} 四字段对比`}
              className="badcase-comparison"
              role="table"
            >
              <div className="badcase-comparison-row" role="row">
                <span role="columnheader">字段</span>
                <span role="columnheader">模型原始值</span>
                <span role="columnheader">人工核验值</span>
                <span role="columnheader">对比结论</span>
              </div>
              {LOCATION_FIELDS.map(({ field, label }) => {
                const matches = selected.actual[field] === selected.expected[field];
                return (
                  <div className="badcase-comparison-row" key={field} role="row">
                    <strong role="rowheader">{label}</strong>
                    <span role="cell" style={WRAP_STYLE}>
                      {displayValue(selected.actual[field])}
                    </span>
                    <span role="cell" style={WRAP_STYLE}>
                      {displayValue(selected.expected[field])}
                    </span>
                    <span
                      className={matches ? "status-match" : "status-mismatch"}
                      role="cell"
                    >
                      {matches ? "一致" : "不一致"}
                    </span>
                  </div>
                );
              })}
            </div>

            <dl className="badcase-analysis">
              <div>
                <dt>风险</dt>
                <dd style={WRAP_STYLE}>{selected.risk}</dd>
              </div>
              <div>
                <dt>原因假设</dt>
                <dd style={WRAP_STYLE}>{selected.rootCauseHypothesis}</dd>
              </div>
              <div>
                <dt>产品策略</dt>
                <dd style={WRAP_STYLE}>{selected.productStrategy}</dd>
              </div>
            </dl>

            <div className="badcase-retests">
              <h3>复测结果</h3>
              {selectedRetestRuns.length > 0 ? (
                <ul>
                  {selectedRetestRuns.map((run) => (
                    <li key={run.runId}>
                      <p style={WRAP_STYLE}>{run.runId}</p>
                      <dl className="badcase-retest-location">
                        {LOCATION_FIELDS.map(({ field, label }) => (
                          <div key={field}>
                            <dt>复测{label}</dt>
                            <dd style={WRAP_STYLE}>
                              {displayValue(run.output[field])}
                            </dd>
                          </div>
                        ))}
                      </dl>
                      <p>置信度：{CONFIDENCE_LABELS[run.output.confidence]}</p>
                      <p className={`decision-label decision-${run.decision}`}>
                        决策：{DECISION_LABELS[run.decision]}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>暂无复测记录</p>
              )}
            </div>
          </div>
        </>
      ) : (
        <p className="empty-message">暂无错误案例</p>
      )}
    </section>
  );
}
