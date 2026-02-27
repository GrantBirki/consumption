import { fireEvent, render, screen } from "@testing-library/svelte";
import { expect, test } from "vitest";

import App from "../src/App.svelte";

test("App renders the maximalist artwork shell", () => {
  const { container } = render(App);

  expect(screen.getByRole("heading", { level: 1, name: "consumption.horse" })).toBeInTheDocument();
  expect(screen.getAllByText("C O N S U M P T I O N")).toHaveLength(7);
  expect(screen.getByText(/browser abuse engine/i)).toBeInTheDocument();
  expect(container.querySelectorAll(".floater__image")).toHaveLength(6);
  expect(document.title).toBe("consumption.horse");
});

test("App updates chaos CSS variables on pointer movement", async () => {
  render(App);

  const stage = screen.getByTestId("chaos-stage");
  stage.getBoundingClientRect = () => ({
    width: 400,
    height: 300,
    left: 0,
    top: 0,
    right: 400,
    bottom: 300,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });

  const before = stage.style.getPropertyValue("--chaos-hue");

  await fireEvent.pointerMove(window, { clientX: 123, clientY: 45 });

  expect(stage.style.getPropertyValue("--chaos-hue")).not.toBe(before);
  expect(stage.style.getPropertyValue("--pointer-x")).not.toBe("");
  expect(stage.style.getPropertyValue("--pointer-y")).not.toBe("");
});
