"use client";

import { useState } from "react";

import { upsertConfirmedPlace } from "../session-collection";
import type {
  ConfirmedPlace,
  ReplaySample,
  ReviewableResult,
} from "../types";
import { HumanReviewForm } from "./HumanReviewForm";
import { InferenceEvidence } from "./InferenceEvidence";
import { LiveClassifier } from "./LiveClassifier";
import { ReplaySampleList } from "./ReplaySampleList";

function toReviewable(sample: ReplaySample): ReviewableResult {
  return {
    id: sample.id,
    mode: "replay",
    ai: sample.ai,
    verified: sample.verified,
  };
}

export function ExperienceLab({ samples }: { samples: ReplaySample[] }) {
  const [mode, setMode] = useState<"replay" | "live">("replay");
  const [selected, setSelected] = useState<ReplaySample | null>(samples[0] ?? null);
  const [liveResult, setLiveResult] = useState<ReviewableResult | null>(null);
  const [collection, setCollection] = useState<ConfirmedPlace[]>([]);

  const activeResult = mode === "live"
    ? liveResult
    : selected
      ? toReviewable(selected)
      : null;

  function returnToReplay() {
    setMode("replay");
    setLiveResult(null);
  }

  return (
    <section aria-labelledby="experience-title" id="experience">
      <header>
        <p>Experience lab</p>
        <h2 id="experience-title">从模型判断到人工确认</h2>
        <p>本次收藏 {collection.length} 个地点</p>
      </header>
      <div aria-label="体验模式" role="tablist">
        <button
          aria-selected={mode === "replay"}
          onClick={returnToReplay}
          role="tab"
          type="button"
        >
          评测回放
        </button>
        <button
          aria-selected={mode === "live"}
          onClick={() => setMode("live")}
          role="tab"
          type="button"
        >
          实时识别
        </button>
      </div>

      {mode === "replay" ? (
        selected ? (
          <div>
            <ReplaySampleList
              onSelect={setSelected}
              samples={samples}
              selectedId={selected.id}
            />
            <InferenceEvidence result={toReviewable(selected)} />
            <HumanReviewForm
              onConfirm={(place) =>
                setCollection((current) => upsertConfirmedPlace(current, place))
              }
              result={toReviewable(selected)}
            />
          </div>
        ) : (
          <p>评测记录正在准备中</p>
        )
      ) : (
        <div>
          <LiveClassifier
            onResult={setLiveResult}
            onReturnToReplay={returnToReplay}
          />
          {activeResult ? (
            <>
              <InferenceEvidence result={activeResult} />
              <HumanReviewForm
                onConfirm={(place) =>
                  setCollection((current) => upsertConfirmedPlace(current, place))
                }
                result={activeResult}
              />
            </>
          ) : null}
        </div>
      )}
    </section>
  );
}
