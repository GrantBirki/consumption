import { fireEvent, render, screen } from "@testing-library/svelte";
import { expect, test, vi } from "vitest";

import App from "../src/App.svelte";

test("App renders the maximalist artwork shell", () => {
  const { container } = render(App);

  expect(screen.getByTestId("chaos-stage").dataset.performanceMode).toBe("potato");
  expect(screen.getByRole("heading", { level: 1, name: "c o n s u m p t i o n" })).toBeInTheDocument();
  expect(screen.getAllByText("C O N S U M P T I O N")).toHaveLength(9);
  expect(screen.getByText(/browser abuse engine/i)).toBeInTheDocument();
  expect(screen.getByText(/counterfeit comfort layer/i)).toBeInTheDocument();
  expect(container.querySelectorAll(".floater__image")).toHaveLength(7);
  expect(container.querySelectorAll(".window")).toHaveLength(3);
  expect(document.title).toBe("consumption");
});

test("App updates chaos CSS variables on pointer movement", async () => {
  vi.useFakeTimers();

  try {
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
    expect(stage.style.getPropertyValue("--chaos-hue")).toBe(before);

    await vi.advanceTimersByTimeAsync(20);
    expect(stage.style.getPropertyValue("--chaos-hue")).toBe(before);

    await vi.advanceTimersByTimeAsync(20);

    const firstUpdate = stage.style.getPropertyValue("--chaos-hue");
    expect(firstUpdate).not.toBe(before);
    expect(stage.style.getPropertyValue("--pointer-x")).not.toBe("");
    expect(stage.style.getPropertyValue("--pointer-y")).not.toBe("");

    await fireEvent.pointerMove(window, { clientX: 124, clientY: 45 });
    await fireEvent.pointerMove(window, { clientX: 125, clientY: 45 });

    await vi.advanceTimersByTimeAsync(12);
    expect(stage.style.getPropertyValue("--chaos-hue")).toBe(firstUpdate);

    await vi.advanceTimersByTimeAsync(40);
    expect(stage.style.getPropertyValue("--chaos-hue")).not.toBe(firstUpdate);
  } finally {
    vi.useRealTimers();
  }
});

test("App keeps the layout stable while idle and only shifts layouts during active pointer movement", async () => {
  vi.useFakeTimers();

  try {
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

    expect(stage.dataset.layoutMode).toBe("scatter");

    await vi.advanceTimersByTimeAsync(6000);
    expect(stage.dataset.layoutMode).toBe("scatter");

    for (let index = 0; index < 40; index += 1) {
      await fireEvent.pointerMove(window, { clientX: 100 + index, clientY: 60 + index });
      await vi.advanceTimersByTimeAsync(120);
    }

    expect(stage.dataset.layoutMode).toBe("stack");
  } finally {
    vi.useRealTimers();
  }
});

test("App throttles scroll updates to animation frames", async () => {
  vi.useFakeTimers();

  try {
    render(App);
    const stage = screen.getByTestId("chaos-stage");
    const setPropertySpy = vi.spyOn(stage.style, "setProperty");

    setPropertySpy.mockClear();
    for (let index = 0; index < 8; index += 1) {
      await fireEvent.scroll(window);
    }

    expect(setPropertySpy).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(40);
    expect(setPropertySpy).toHaveBeenCalled();
  } finally {
    vi.useRealTimers();
  }
});

test("App interactions run without console errors or warnings", async () => {
  vi.useFakeTimers();
  const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

  try {
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

    await fireEvent.pointerMove(window, { clientX: 140, clientY: 90 });
    await fireEvent.scroll(window);
    await vi.advanceTimersByTimeAsync(9000);

    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  } finally {
    errorSpy.mockRestore();
    warnSpy.mockRestore();
    vi.useRealTimers();
  }
});
