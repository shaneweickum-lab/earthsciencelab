import { describe, expect, it } from "vitest";
import { missingSettings } from "./supabase";

describe("the cloud connection", () => {
  it("names the settings that are missing", () => {
    expect(missingSettings("https://x.supabase.co", "key")).toEqual([]);
    expect(missingSettings("https://x.supabase.co", undefined)).toEqual(["NEXT_PUBLIC_SUPABASE_ANON_KEY"]);
    expect(missingSettings(undefined, undefined)).toEqual(["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]);
  });
});
