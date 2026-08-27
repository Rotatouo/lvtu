"use client";

import Image from "next/image";
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
    <section aria-labelledby="experience-title" className="portfolio-band experience-section" id="experience">
      <header className="portfolio-shell experience-header">
        <div>
          <p>Experience lab</p>
        <h2 id="experience-title">从模型判断到人工确认</h2>
          <span>选择一条真实记录，查看模型原始值，再决定是否接受或修改。</span>
        </div>
        <p className="collection-count"><strong>{collection.length}</strong> 本次收藏</p>
      </header>
      <div className="portfolio-shell">
        <div aria-label="体验模式" className="experience-tabs" role="tablist">
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
          <div className="experience-workspace">
            <ReplaySampleList
              onSelect={setSelected}
              samples={samples}
              selectedId={selected.id}
            />
            <div className="evidence-column">
              <figure className="selected-sample-image">
                <Image
                  alt={selected.imageAlt}
                  fill
                  sizes="(max-width: 760px) 100vw, 36vw"
                  src={selected.imageSrc}
                />
                <figcaption>{selected.title} · {selected.sourceNote}</figcaption>
              </figure>
              <InferenceEvidence result={toReviewable(selected)} />
            </div>
            <HumanReviewForm
              onConfirm={(place) =>
                setCollection((current) => upsertConfirmedPlace(current, place))
              }
              result={toReviewable(selected)}
            />
          </div>
        ) : (
          <p className="empty-message">评测记录正在准备中</p>
        )
      ) : (
        <div className="live-workspace">
          <LiveClassifier
            onResult={setLiveResult}
            onRequestStart={() => setLiveResult(null)}
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
      </div>
    </section>
  );
}
