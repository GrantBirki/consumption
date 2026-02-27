import { fireEvent, render, screen } from "@testing-library/svelte";
import { expect, test, vi } from "vitest";

vi.mock("../src/lib/device.js", () => ({
  resolveStickyHeadLimit: () => 2,
}));

import App from "../src/App.svelte";

test("App triggers BSOD after two clicks when the device limit is mobile", async () => {
  render(App);

  await fireEvent.click(window);
  expect(screen.queryByTestId("bsod-screen")).not.toBeInTheDocument();

  await fireEvent.click(window);
  expect(screen.getByTestId("bsod-screen")).toBeInTheDocument();
});
