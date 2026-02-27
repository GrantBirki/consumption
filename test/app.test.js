import { render, screen } from "@testing-library/svelte";
import { expect, test } from "vitest";

import App from "../src/App.svelte";

test("App renders the hello world page", () => {
  render(App);

  expect(screen.getByText("Svelte + GitHub Pages")).toBeInTheDocument();
  expect(screen.getByRole("heading", { level: 1, name: "Hello world." })).toBeInTheDocument();
  expect(
    screen.getByText("A dead simple Svelte hello world deployed with GitHub Pages.")
  ).toBeInTheDocument();
  expect(document.title).toBe("consumption.horse");
});
