export type MatchResult = {
  total: number;
  firstPosition: number | null;
};

const STOP_WORDS = new Set(["the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for"]);

export function matchAliases(normalisedText: string, aliases: string[]): MatchResult {
  let total = 0;
  let firstPosition: number | null = null;

  for (const alias of aliases) {
    const needle = alias.toLowerCase().trim();
    if (!needle || needle.length < 2 || STOP_WORDS.has(needle)) continue;

    let from = 0;
    while (from < normalisedText.length) {
      const idx = normalisedText.indexOf(needle, from);
      if (idx === -1) break;

      // Word boundary check
      const before = idx === 0 ? " " : normalisedText[idx - 1];
      const after =
        idx + needle.length >= normalisedText.length ? " " : normalisedText[idx + needle.length];
      const wordBoundaryBefore = /\W/.test(before);
      const wordBoundaryAfter = /\W/.test(after);

      if (wordBoundaryBefore && wordBoundaryAfter) {
        total += 1;
        if (firstPosition === null || idx < firstPosition) {
          firstPosition = idx;
        }
      }

      from = idx + needle.length;
    }
  }

  return { total, firstPosition };
}
