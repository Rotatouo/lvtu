import type { ReplaySample } from "../types";

const clueLabels = {
  text: "文字线索",
  landmark: "地标线索",
  weak: "弱线索",
  conflict: "冲突线索",
} as const;

const decisionLabels = {
  confirm: "可直接确认",
  review: "需要核对",
  manual: "需要手动补充",
} as const;

interface ReplaySampleListProps {
  samples: ReplaySample[];
  selectedId: string;
  onSelect: (sample: ReplaySample) => void;
}

export function ReplaySampleList({
  samples,
  selectedId,
  onSelect,
}: ReplaySampleListProps) {
  return (
    <div aria-label="评测样本" role="list">
      {samples.map((sample) => (
        <button
          aria-current={sample.id === selectedId ? "true" : undefined}
          key={sample.id}
          onClick={() => onSelect(sample)}
          role="listitem"
          type="button"
        >
          <strong>{sample.title}</strong>
          <span>{clueLabels[sample.clueType]}</span>
          <span>{decisionLabels[sample.decision]}</span>
        </button>
      ))}
    </div>
  );
}
