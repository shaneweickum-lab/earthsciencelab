import { describe, expect, it } from "vitest";
import { CHAT_MAX, cleanChat, isBlocked } from "./chatFilter";

describe("the chat filter", () => {
  it("leaves friendly messages alone", () => {
    for (const ok of ["Hi!", "Want to trade carrots for 3 stone?", "Come to my garden 🌱", "My class is great", "Dickens wrote books", "I passed the assessment", "Scunthorpe", "The hoe is in the chest"]) {
      expect(cleanChat(ok)).toBe(ok);
    }
  });

  it("blanks out bad language, disguised or not", () => {
    expect(cleanChat("this is shit")).toBe("this is ***");
    expect(cleanChat("Sh1t!")).toBe("***!");
    expect(cleanChat("fuuuuuck")).toBe("***");
    expect(cleanChat("f u c k this")).toBe("*** this");
    expect(cleanChat("s.h.i.t")).toBe("***");
    expect(cleanChat("you are a b!tch")).toBe("you are a ***");
    expect(isBlocked("FUCKING")).toBe(true);
    expect(isBlocked("ass")).toBe(true);
    expect(isBlocked("class")).toBe(false);
  });

  it("blocks ways to get in touch outside the game", () => {
    expect(cleanChat("go to https://example.com/x now")).toBe("go to *** now");
    expect(cleanChat("www.mysite.net")).toBe("***");
    expect(cleanChat("site dot com stuff")).not.toContain("dot com");
    expect(cleanChat("mail me at kid@school.org")).toBe("mail me at ***");
    expect(cleanChat("call 555-123-4567")).toBe("call ***");
    expect(cleanChat("follow @farmkid")).toBe("follow ***");
    expect(cleanChat("add me on snap")).toBe("add me on ***");
    expect(cleanChat("I have 25 carrots")).toBe("I have 25 carrots");
  });

  it("trims, tidies, and cuts long messages", () => {
    expect(cleanChat("  hello \n\n there  ")).toBe("hello there");
    expect(cleanChat("a".repeat(500))).toHaveLength(CHAT_MAX);
    expect(cleanChat("   ")).toBe("");
    expect(cleanChat("zero\u200bwidth")).toBe("zerowidth");
  });
});
