import { tokenizeHemistich } from "./tokenize";
import { generate } from "./search";

// وزن الكلمة منفردة، بنفس تعريف أرشيف القوافي (tools/qawafi/wazn.py: scan):
// تُوزن بعد "يا" لمحاكاة الوصل، ويُحذف بِت ألف الوصل، والبدائل هي المتعادلة فقط.
const TIE = 0.05;

export function wordWazn(word: string, nAlts = 3): { bits: string; alts: string[] } {
  const h = tokenizeHemistich(`يا ${word}`);
  const cands = generate(h);
  if (!cands.length) return { bits: "", alts: [] };
  const out: string[] = [];
  for (const c of cands.slice(0, 1 + 2 * nAlts)) {
    if (c.cost - cands[0]!.cost > TIE) break;
    let bits = "";
    h.phonemes.forEach((p, k) => {
      const a = c.assign[k]!;
      if (p.wordI === 1 && a !== -1 && p.kind !== "wasl") bits += String(a);
    });
    if (bits && !out.includes(bits)) out.push(bits);
  }
  return out.length ? { bits: out[0]!, alts: out.slice(1, 1 + nAlts) } : { bits: "", alts: [] };
}
