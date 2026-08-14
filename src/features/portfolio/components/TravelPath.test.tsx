import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

vi.mock("framer-motion", () => ({
  motion: {
    path: (props: { initial?: unknown; "data-testid"?: string }) => (
      <path
        data-initial={String(props.initial)}
        data-testid={props["data-testid"]}
      />
    ),
  },
  useReducedMotion: () => true,
}));

import { TravelPath } from "./TravelPath";

it("skips the path entrance animation when reduced motion is requested", () => {
  render(<TravelPath />);

  expect(screen.getByTestId("travel-path-motion")).toHaveAttribute(
    "data-initial",
    "false",
  );
});
