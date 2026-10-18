import { isBlocked } from "@/world/chatFilter";

/**
 * Rules for student accounts, shared by the sign-up forms and the server routes. Students sign in
 * with a username and password (no email), and add classes later with class codes.
 */

/** Kid-friendly login words: three words and a number, like "otter-maple-river-42". */
const WORDS = [
  "acorn", "apple", "badger", "basil", "beaver", "berry", "birch", "bison", "breeze", "brook", "cactus", "canyon",
  "cedar", "clover", "comet", "coral", "cricket", "daisy", "delta", "dune", "eagle", "ember", "falcon", "fern",
  "finch", "fossil", "frog", "garnet", "geyser", "glacier", "granite", "harbor", "hazel", "heron", "island", "jasper",
  "juniper", "kelp", "lagoon", "lichen", "lotus", "maple", "marble", "meadow", "mesa", "moss", "nectar", "oak",
  "otter", "pebble", "pine", "pollen", "prairie", "quartz", "raven", "reef", "river", "robin", "sage", "salmon",
  "sprout", "tundra", "willow", "wren",
];

export function loginWords(): string {
  const bytes = crypto.getRandomValues(new Uint32Array(4));
  const w = (i: number) => WORDS[bytes[i] % WORDS.length];
  return `${w(0)}-${w(1)}-${w(2)}-${10 + (bytes[3] % 90)}`;
}

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;
export const PASSWORD_MIN = 6;
export const PASSWORD_MAX = 72;

/** Usernames ignore case and stray spaces; dashes and spaces become underscores. */
export const normalizeUsername = (s: string) => s.trim().toLowerCase().replace(/[\s-]+/g, "_");

/** Why a username won't do, or null if it's fine. */
export function checkUsername(raw: string): string | null {
  const u = normalizeUsername(raw);
  if (u.length < USERNAME_MIN || u.length > USERNAME_MAX) return `Usernames are ${USERNAME_MIN} to ${USERNAME_MAX} letters and numbers long.`;
  if (!/^[a-z0-9_]+$/.test(u)) return "Use only letters, numbers, and _ in your username.";
  if (/^[0-9_]+$/.test(u)) return "Put at least one letter in your username.";
  if (u.split("_").some((part) => isBlocked(part)) || isBlocked(u)) return "Pick a different username.";
  return null;
}

/** Why a password won't do, or null if it's fine. */
export function checkPassword(p: string): string | null {
  if (p.length < PASSWORD_MIN) return `Passwords need at least ${PASSWORD_MIN} characters. Try the easy login words!`;
  if (p.length > PASSWORD_MAX) return "That password is too long.";
  return null;
}
