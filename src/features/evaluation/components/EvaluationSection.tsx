"use client";

import { useState } from "react";

import type {
  EvaluationReport,
  LocationField,
  TierMetrics,
} from "../metrics";
import type { ClueTier, ExpectedDecision } from "../types";

type EvaluationFilter = "all" | ClueTier;

const FILTERS: Array<{ value: EvaluationFilter; label: string }> = [
  { value: "all", label: "全部样本" },
  { value: "text", label: "文字线索" },
  { value: "landmark", label: "地标线索" },
  { value: "weak", label: "弱线索" },
];

const FIELD_LABELS: Array<{ field: LocationField; label: string }> = [
  { field: "country", label: "国家" },
  { field: "region", label: "省级地区" },
  { field: "city", label: "城市" },
  { field: "attraction", label: "景点" },
];

const DECISION_LABELS: Array<{
  decision: ExpectedDecision;
  label: string;
  className: string;
}> = [
  {
    decision: "confirm",
    label: "自动确认",
    className: "border-emerald-300 bg-emerald-50 text-emerald-900",
  },
  {
    decision: "review",
    label: "建议复核",
    className: "border-amber-300 bg-amber-50 text-amber-950",
  },
  {
    decision: "manual",
    label: "人工判断",
    className: "border-rose-300 bg-rose-50 text-rose-950",
  },
];

function formatPercentage(rate: number) {
  const percentage = Math.round(rate * 1_000) / 10;
  return `${Number.isInteger(percentage) ? percentage.toFixed(0) : percentage.toFixed(1)}%`;
}

function FieldMetrics({ metrics }: { metrics: TierMetrics }) {
  return (
    <div
      aria-label="地点字段准确率"
      className="grid grid-cols-2 gap-3 lg:grid-cols-4"
    >
      {FIELD_LABELS.map(({ field, label }) => {
        const metric = metrics.fields[field];
        return (
          <div
            key={field}
            role="group"
            aria-label={`${label}准确率`}
            className="rounded-md border border-neutral-200 bg-white p-4"
          >
            <p className="text-sm text-neutral-600">{label}</p>
            <p className="mt-2 flex items-baseline justify-between gap-2">
              <strong className="text-xl font-semibold text-neutral-950">
                {metric.correct} / {metric.total}
              </strong>
              <span className="text-sm tabular-nums text-neutral-600">
                {formatPercentage(metric.rate)}
              </span>
            </p>
          </div>
        );
      })}
    </div>
  );
}

function DecisionMetrics({ metrics }: { metrics: TierMetrics }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3" aria-label="评测决策分布">
      {DECISION_LABELS.map(({ decision, label, className }) => (
        <div
          key={decision}
          role="group"
          aria-label={`${label} ${decision}`}
          className={`flex items-center justify-between rounded-md border px-4 py-3 ${className}`}
        >
          <span>
            <span className="block text-sm font-medium">{label}</span>
            <span className="block text-xs opacity-70">{decision}</span>
          </span>
          <span className="text-right tabular-nums">
            <strong className="block text-lg">
              {metrics.decisions[decision].count} / {metrics.decisions[decision].total}
            </strong>
            <span className="block text-xs opacity-70">
              {formatPercentage(metrics.decisions[decision].rate)}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

export function EvaluationSection({ report }: { report: EvaluationReport }) {
  const [filter, setFilter] = useState<EvaluationFilter>("all");
  const metrics = filter === "all" ? report : report.tiers[filter];

  return (
    <section aria-labelledby="evaluation-title" className="evaluation-section">
      <div className="section-heading evaluation-section-intro">
        <p>Exploratory evaluation</p>
        <h2>评测结果决定自动化边界与人工确认策略。</h2>
        <span>
          30 张样本按文字、地标和弱线索分层。字段正确率与决策分布分别计算，避免用一个总分掩盖真实风险。
        </span>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h3
            id="evaluation-title"
            className="text-2xl font-semibold text-neutral-950"
          >
            {report.sampleCount} 张探索性评测
          </h3>
          <p className="mt-1 text-sm text-neutral-600">
            当前范围：{metrics.sampleCount} 张
          </p>
        </div>

        <div
          role="group"
          aria-label="按线索类型筛选"
          className="flex flex-wrap gap-1 rounded-md border border-neutral-200 bg-neutral-100 p-1"
        >
          {FILTERS.map(({ value, label }) => {
            const selected = filter === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={selected}
                onClick={() => setFilter(value)}
                className={`rounded px-3 py-2 text-sm font-medium transition-colors ${
                  selected
                    ? "bg-neutral-950 text-white"
                    : "text-neutral-700 hover:bg-white"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 space-y-5" aria-live="polite">
        <FieldMetrics metrics={metrics} />
        <DecisionMetrics metrics={metrics} />
      </div>
    </section>
  );
}
