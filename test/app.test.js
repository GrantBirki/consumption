import { fireEvent, render, screen } from "@testing-library/svelte";
import { expect, test, vi } from "vitest";

import App from "../src/App.svelte";

test("App renders the maximalist artwork shell", () => {
  const { container } = render(App);

  expect(screen.getByTestId("chaos-stage").dataset.performanceMode).toBe("potato");
  expect(screen.getByRole("heading", { level: 1, name: "c o n s u m p t i o n" })).toBeInTheDocument();
  expect(screen.getAllByText("C O N S U M P T I O N")).toHaveLength(7);
  expect(screen.getByText(/browser abuse engine/i)).toBeInTheDocument();
  expect(screen.getByText(/counterfeit comfort layer/i)).toBeInTheDocument();
  expect(container.querySelectorAll(".floater__image")).toHaveLength(5);
  expect(container.querySelectorAll(".window")).toHaveLength(2);
  expect(document.title).toBe("consumption");
});

test("App adds sticky heads on click and scales them up with each click", async () => {
  render(App);

  expect(screen.queryAllByTestId("sticky-head")).toHaveLength(0);

  for (let index = 0; index < 3; index += 1) {
    await fireEvent.click(window);
  }

  const heads = screen.getAllByTestId("sticky-head");
  const sizeValues = heads.map((head) => Number(head.dataset.sizeRem));

  expect(heads).toHaveLength(3);
  expect(sizeValues[0]).toBeLessThan(sizeValues[1]);
  expect(sizeValues[1]).toBeLessThan(sizeValues[2]);
});

test("App shows BSOD on the 10th click and restores the normal scene after 8 seconds", async () => {
  vi.useFakeTimers();

  try {
    render(App);

    for (let index = 0; index < 9; index += 1) {
      await fireEvent.click(window);
    }

    expect(screen.getAllByTestId("sticky-head")).toHaveLength(9);

    await fireEvent.click(window);
    expect(screen.getByTestId("bsod-screen")).toBeInTheDocument();
    expect(screen.queryByTestId("chaos-stage")).not.toBeInTheDocument();

    await vi.advanceTimersByTimeAsync(7900);
    expect(screen.getByTestId("bsod-screen")).toBeInTheDocument();

    await vi.advanceTimersByTimeAsync(100);
    await Promise.resolve();
    await Promise.resolve();

    expect(screen.queryByTestId("bsod-screen")).not.toBeInTheDocument();
    expect(screen.getByTestId("chaos-stage")).toBeInTheDocument();
    expect(screen.queryAllByTestId("sticky-head")).toHaveLength(0);
  } finally {
    vi.useRealTimers();
  }
});

test("App exits BSOD early when any key is pressed", async () => {
  vi.useFakeTimers();

  try {
    render(App);

    for (let index = 0; index < 10; index += 1) {
      await fireEvent.click(window);
    }

    expect(screen.getByTestId("bsod-screen")).toBeInTheDocument();

    await fireEvent.keyDown(window, { key: "a" });
    await Promise.resolve();
    await Promise.resolve();

    expect(screen.queryByTestId("bsod-screen")).not.toBeInTheDocument();
    expect(screen.getByTestId("chaos-stage")).toBeInTheDocument();
    expect(screen.queryAllByTestId("sticky-head")).toHaveLength(0);
  } finally {
    vi.useRealTimers();
  }
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

    await vi.advanceTimersByTimeAsync(40);
    expect(stage.style.getPropertyValue("--chaos-hue")).toBe(before);

    await vi.advanceTimersByTimeAsync(80);

    const firstUpdate = stage.style.getPropertyValue("--chaos-hue");
    expect(firstUpdate).not.toBe(before);
    expect(stage.style.getPropertyValue("--pointer-x")).not.toBe("");
    expect(stage.style.getPropertyValue("--pointer-y")).not.toBe("");

    await fireEvent.pointerMove(window, { clientX: 124, clientY: 45 });
    await fireEvent.pointerMove(window, { clientX: 125, clientY: 45 });

    await vi.advanceTimersByTimeAsync(50);
    expect(stage.style.getPropertyValue("--chaos-hue")).not.toBe(before);

    await vi.advanceTimersByTimeAsync(120);
    expect(stage.style.getPropertyValue("--chaos-hue")).not.toBe(firstUpdate);
  } finally {
    vi.useRealTimers();
  }
});

test("App switches into pointer-active render mode while the mouse is moving", async () => {
  vi.useFakeTimers();

  try {
    render(App);
    const stage = screen.getByTestId("chaos-stage");

    expect(stage.dataset.pointerActive).toBe("off");

    await fireEvent.pointerMove(window, { clientX: 150, clientY: 80 });
    expect(stage.dataset.pointerActive).toBe("on");

    await vi.advanceTimersByTimeAsync(200);
    expect(stage.dataset.pointerActive).toBe("off");
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
