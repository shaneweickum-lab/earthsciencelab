import { describe, expect, it } from "vitest";
import { checkPassword, checkUsername, loginWords, normalizeUsername } from "./accounts";

describe("student accounts", () => {
  it("tidy usernames", () => {
    expect(normalizeUsername("  Farm Kid-7 ")).toBe("farm_kid_7");
  });

  it("accept good usernames and explain bad ones", () => {
    for (const ok of ["sprout42", "Carrot_Queen", "bean", "x_y_z"]) expect(checkUsername(ok)).toBeNull();
    expect(checkUsername("ab")).toMatch(/3 to 20/);
    expect(checkUsername("a".repeat(21))).toMatch(/3 to 20/);
    expect(checkUsername("hi!there")).toMatch(/only letters/);
    expect(checkUsername("12345")).toMatch(/one letter/);
    expect(checkUsername("shit_lord")).toMatch(/different/);
    expect(checkUsername("CoolF4ck")).toBeNull();
    expect(checkUsername("fuck99")).toMatch(/different/);
  });

  it("check passwords and make easy login words", () => {
    expect(checkPassword("abc")).toMatch(/at least 6/);
    expect(checkPassword("abcdef")).toBeNull();
    expect(checkPassword("x".repeat(80))).toMatch(/too long/);
    expect(loginWords()).toMatch(/^[a-z]+-[a-z]+-[a-z]+-\d{2}$/);
    expect(checkPassword(loginWords())).toBeNull();
  });
});
