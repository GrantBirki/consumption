import "@testing-library/jest-dom/vitest";

import { afterEach } from "vitest";
import { cleanup } from "@testing-library/svelte";

if (!globalThis.requestAnimationFrame) {
  globalThis.requestAnimationFrame = (callback) => setTimeout(() => callback(Date.now()), 16);
}

if (!globalThis.cancelAnimationFrame) {
  globalThis.cancelAnimationFrame = (handle) => clearTimeout(handle);
}

afterEach(() => {
  cleanup();
});
