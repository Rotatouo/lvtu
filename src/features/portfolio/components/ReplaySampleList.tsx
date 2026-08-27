import Image from "next/image";

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
    <ul aria-label="评测样本" className="replay-list">
      {samples.map((sample) => (
        <li className="replay-list-item" key={sample.id}>
          <button
            aria-current={sample.id === selectedId ? "true" : undefined}
            className="replay-item"
            onClick={() => onSelect(sample)}
            type="button"
          >
            <Image alt="" height={54} src={sample.imageSrc} width={72} />
            <span className="replay-item-copy">
              <strong>{sample.title}</strong>
              <small>{clueLabels[sample.clueType]} · {decisionLabels[sample.decision]}</small>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
