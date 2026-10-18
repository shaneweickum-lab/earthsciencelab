/**
 * Keeps multiplayer chat friendly for students. Messages are trimmed and cut to length; bad
 * language is blanked out (including the usual disguises: l33t letters, stretched letters, and
 * letters split up with spaces or dots); and links, emails, phone numbers, @handles, and the
 * names of chat apps are blocked, so nobody can pass on a way to contact them.
 *
 * The lists are deliberately easy to extend.
 */

export const CHAT_MAX = 120;
const BLOCKED = "***";

/** Blocked when a word starts with one of these (so "shitty" and "fucking" are caught too). */
const ROOTS = [
  "fuck", "fuk", "fck", "shit", "bitch", "bastard", "cunt", "asshole", "arsehole", "motherf", "nigg", "faggot", "retard", "whore",
  "slut", "piss", "porn", "dickhead", "jackass", "dumbass", "wanker", "bollock", "twat", "prick",
];

/** Blocked only as whole words (they're also the start of ordinary words). */
const WORDS = [
  "ass", "asses", "arse", "dick", "dicks", "cock", "cocks", "pussy", "fag", "fags", "tits", "titty", "boob", "boobs", "damn", "dammit",
  "goddamn", "sex", "sexy", "nude", "nudes", "rape", "raped", "rapist", "nazi", "kys", "stfu", "wtf", "milf", "crap",
  // Apps for swapping contacts.
  "snap", "snapchat", "insta", "instagram", "tiktok", "discord", "whatsapp", "kik", "telegram", "facebook", "fb", "roblox", "email",
];

const LEET: Record<string, string> = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "8": "b", "@": "a", "$": "s", "!": "i", "|": "i", "+": "t" };

/** Lowercase letters only, with l33t letters read as letters. */
function letters(word: string): string {
  return [...word.toLowerCase()].map((c) => LEET[c] ?? c).filter((c) => c >= "a" && c <= "z").join("");
}

/** "fuuuuck" → "fuck": runs of a letter squashed to one. */
const squash = (w: string) => w.replace(/(.)\1+/g, "$1");

const SQUASHED_ROOTS = ROOTS.map(squash).filter((r) => r.length >= 3);
const SQUASHED_WORDS = WORDS.map(squash).filter((w) => w.length >= 4);

/** Is this (single) word one we blank out? */
export function isBlocked(word: string): boolean {
  const w = letters(word);
  if (!w) return false;
  if (WORDS.includes(w) || ROOTS.some((r) => w.startsWith(r))) return true;
  const s = squash(w);
  return SQUASHED_WORDS.includes(s) || SQUASHED_ROOTS.some((r) => s.startsWith(r));
}

/** Patterns that would share a way to get in touch outside the game. */
const CONTACT = [
  /\b(?:https?:\/\/|www\.)\S+/gi,
  /\S+@\S+\.\S+/g,
  /\b[a-z0-9-]+\s?(?:\.|\(dot\)|\bdot\b)\s?(?:com|net|org|io|gg|co|me|tv|xyz|ly|app|dev|us|uk|ca|edu|link)\b\S*/gi,
  /\+?\d[\d\s().-]{5,}\d/g,
  /(^|\s)@\w+/g,
];

/** Control characters and invisible ones (zero-width spaces, direction marks). */
const INVISIBLE = new RegExp("[\\u0000-\\u001f\\u007f\\u200b-\\u200f\\u2028-\\u202e\\u2060-\\u206f\\ufeff]", "g");

/** Make a message fit to send, or "" if nothing's left. */
export function cleanChat(raw: string): string {
  let text = String(raw ?? "").replace(INVISIBLE, "").replace(/\s+/g, " ").trim();
  text = [...text].slice(0, CHAT_MAX).join("");
  for (const re of CONTACT) text = text.replace(re, (m, lead) => `${typeof lead === "string" ? lead : ""}${BLOCKED}`);
  // Words spelled out with gaps ("f u c k", "s.h.i.t"): join single letters and check them together.
  text = text.replace(/\b(?:[a-z0-9@$!][\s.*_-]){2,}[a-z0-9@$!]\b/gi, (m) => (isBlocked(m.replace(/[\s.*_-]/g, "")) ? BLOCKED : m));
  text = text.replace(/[^\s]+/g, (w) => {
    if (w === BLOCKED) return w;
    // Keep punctuation around a word, and check what's inside.
    const core = w.replace(/^[^a-z0-9@$]+|[^a-z0-9@$]+$/gi, "");
    return core && isBlocked(core) ? w.replace(core, BLOCKED) : w;
  });
  return text.trim();
}
