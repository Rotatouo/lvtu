"use client";

import { useState } from "react";

import type {
  ConfirmedPlace,
  LocationFields,
  ReviewableResult,
} from "../types";

const fieldLabels: Record<keyof LocationFields, string> = {
  country: "国家",
  region: "省级地区",
  city: "城市",
  attraction: "地点",
};

interface HumanReviewFormProps {
  result: ReviewableResult;
  onConfirm: (place: ConfirmedPlace) => void;
  now?: () => Date;
}

function toEditableFields(fields: LocationFields): Record<keyof LocationFields, string> {
  return {
    country: fields.country ?? "",
    region: fields.region ?? "",
    city: fields.city ?? "",
    attraction: fields.attraction ?? "",
  };
}

function HumanReviewFormFields({
  result,
  onConfirm,
  now = () => new Date(),
}: HumanReviewFormProps) {
  const [finalFields, setFinalFields] = useState(() =>
    toEditableFields(result.verified),
  );

  function updateField(key: keyof LocationFields, value: string) {
    setFinalFields((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onConfirm({
      sampleId: result.id,
      ai: { ...result.ai },
      final: {
        country: finalFields.country.trim() || null,
        region: finalFields.region.trim() || null,
        city: finalFields.city.trim() || null,
        attraction: finalFields.attraction.trim() || null,
      },
      confirmedAt: now().toISOString(),
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <fieldset>
        <legend>核对并确认最终地点</legend>
        {(Object.keys(fieldLabels) as Array<keyof LocationFields>).map((key) => (
          <label key={key}>
            <span>{fieldLabels[key]}</span>
            <input
              name={key}
              onChange={(event) => updateField(key, event.target.value)}
              value={finalFields[key]}
            />
          </label>
        ))}
      </fieldset>
      <button type="submit">确认并加入本次收藏</button>
    </form>
  );
}

export function HumanReviewForm(props: HumanReviewFormProps) {
  return <HumanReviewFormFields key={props.result.id} {...props} />;
}
