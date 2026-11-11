import { describe, expect, it } from "vitest";
import { USERNAME_RE, isInternalAddress, loginAddress, suggestUsername } from "./studentLogin";

describe("student usernames", () => {
  it("logs in with a username or an email", () => {
    expect(loginAddress(" Amy.Chen ")).toBe("amy.chen@student.dreamplaneredu.com");
    expect(loginAddress("amy@gmail.com")).toBe("amy@gmail.com");
  });
  it("suggests a valid username from a name", () => {
    expect(suggestUsername("Amy Chen")).toBe("amy.chen");
    expect(suggestUsername("陈 Amy")).toBe("amy");
    expect(USERNAME_RE.test(suggestUsername("Amy Chen"))).toBe(true);
    expect(USERNAME_RE.test("ab")).toBe(false);
    expect(USERNAME_RE.test(".amy")).toBe(false);
  });
  it("recognises the internal login address", () => {
    expect(isInternalAddress("amy.chen@student.dreamplaneredu.com")).toBe(true);
    expect(isInternalAddress("amy@gmail.com")).toBe(false);
  });
});
