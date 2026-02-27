import { beforeEach, expect, test, vi } from "vitest";

vi.mock("svelte", async () => {
  const actual = await vi.importActual("svelte");
  return {
    ...actual,
    mount: vi.fn(() => ({ mounted: true })),
  };
});

beforeEach(() => {
  vi.resetModules();
});

test("main.js throws when #app is missing", async () => {
  document.body.innerHTML = "";

  await expect(import("../src/main.js")).rejects.toThrow("Missing #app mount target");
});

test("main.js mounts App when #app exists", async () => {
  document.body.innerHTML = '<div id="app"></div>';

  const svelte = await import("svelte");
  svelte.mount.mockClear();

  const mod = await import("../src/main.js");
  const target = document.getElementById("app");

  expect(mod.default).toEqual({ mounted: true });
  expect(svelte.mount).toHaveBeenCalledTimes(1);
  expect(svelte.mount.mock.calls[0][1]).toEqual({ target });
});
