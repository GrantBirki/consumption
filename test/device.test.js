import { expect, test } from "vitest";

import { resolveStickyHeadLimit } from "../src/lib/device.js";

test("resolveStickyHeadLimit returns desktop limit by default", () => {
  expect(resolveStickyHeadLimit()).toBe(10);
});

test("resolveStickyHeadLimit returns mobile limit for mobile user agents", () => {
  expect(
    resolveStickyHeadLimit({
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)",
      viewportWidth: 1200,
      hasCoarsePointer: false,
    })
  ).toBe(2);
});

test("resolveStickyHeadLimit returns mobile limit for coarse pointer on small viewports", () => {
  expect(
    resolveStickyHeadLimit({
      userAgent: "Mozilla/5.0 (X11; Linux x86_64)",
      viewportWidth: 390,
      hasCoarsePointer: true,
    })
  ).toBe(2);
});

test("resolveStickyHeadLimit keeps desktop limit on large coarse-pointer displays", () => {
  expect(
    resolveStickyHeadLimit({
      userAgent: "Mozilla/5.0 (X11; Linux x86_64)",
      viewportWidth: 1280,
      hasCoarsePointer: true,
    })
  ).toBe(10);
});
