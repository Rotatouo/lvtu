import type { ConfirmedPlace } from "./types";

export function upsertConfirmedPlace(
  collection: ConfirmedPlace[],
  incoming: ConfirmedPlace,
): ConfirmedPlace[] {
  return [
    incoming,
    ...collection.filter((item) => item.sampleId !== incoming.sampleId),
  ];
}
