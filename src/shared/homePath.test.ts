import { expect, it } from "vitest";
import { homePath } from "./homePath";
it("sends each role to its own dashboard", () => {
  expect(homePath("counselor", "u")).toBe("/counselor-dashboard");
  expect(homePath("admin", "u")).toBe("/admin-dashboard");
  expect(homePath("student", "u")).toBe("/student-dashboard/u");
  expect(homePath("counselor", null)).toBe("/login");
  expect(homePath(undefined, "u")).toBe("/");
});
