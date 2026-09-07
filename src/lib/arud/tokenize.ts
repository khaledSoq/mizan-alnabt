import type { Hemistich, Kind, Phoneme } from "./types";

const SHAMSI = new Set([... "تثدذرزسشصضطظلن"]);
const ALIF_MADD = new Set(["ا", "ٱ"]);
const MADDA_ALIF = "آ";
const WAW = "و";
const YA = "ي";
const TA_MARBUTA = "ة";
const LAM = "ل";
const SHADDA = "\u0651";
const SUKUN = "\u0652";
const FATHA = "\u064e";
const DAMMA = "\u064f";
const KASRA = "\u0650";
const TATWEEL = "\u0640";
const SUPERSCRIPT_ALIF = "\u0670";
const FATHATAN = "\u064b";
const DAMMATAN = "\u064c";
const KASRATAN = "\u064d";

const HARAKAT = new Set([
  SHADDA,
  SUKUN,
  FATHA,
  DAMMA,
  KASRA,
  FATHATAN,
  DAMMATAN,
  KASRATAN,
  SUPERSCRIPT_ALIF,
]);
const VOWEL_MARKS = new Set([FATHA, DAMMA, KASRA]);
const PREFIX_CONNECT = new Set([..."وفبكل"]);

const FUNCTION_10 = new Set([
  "يا",
  "من",
  "عن",
  "في",
  "لم",
  "هل",
  "بل",
  "قد",
  "إن",
  "أن",
  "او",
  "أو",
  "ما",
  "لا",
  "له",
  "به",
  "كم",
  "ثم",
]);

const PRONOUNS = new Set(["هو", "هي", "هم", "هن", "هما"]);

const ALLAH_FORMS = new Set([
  "الله",
  "اللّه",
  "اللَّه",
  "اللّٰه",
  "لله",
  "والله",
  "بالله",
  "تالله",
  "فالله",
]);

function isArabicLetter(ch: string): boolean {
  const o = ch.codePointAt(0) ?? 0;
  return (o >= 0x0621 && o <= 0x063a) || (o >= 0x0641 && o <= 0x064a) || "ةىآأإؤئءٱ".includes(ch);
}

export function stripHarakat(text: string): string {
  return [...text].filter((ch) => !HARAKAT.has(ch) && ch !== TATWEEL).join("");
}

const KEEP_RE = /[^\u0600-\u06FF\s*]+/g;
const MULTI_SPACE = /\s+/g;
const NUMBERING = /^[\d٠-٩]+[.\-)\]]\s*/;

export function splitBayt(text: string): string[] {
  if (!text || !text.trim()) return [];
  const t = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  let parts: string[];
  if (t.includes("***")) parts = t.split("***").map((p) => p.trim());
  else if (t.includes("\n")) parts = t.split("\n").map((p) => p.trim());
  else if (t.includes(" * ")) parts = t.split(" * ").map((p) => p.trim());
  else if ((t.match(/\*/g) || []).length === 1) parts = t.split("*").map((p) => p.trim());
  else parts = [t.trim()];
  return parts.filter(Boolean);
}

export function cleanLine(text: string): string {
  let t = text.trim().replaceAll(TATWEEL, "");
  t = t.replace(NUMBERING, "");
  t = t.replace(KEEP_RE, " ").replaceAll("*", " ");
  return t.replace(MULTI_SPACE, " ").trim();
}

type BaseLetter = { ch: string; sukun: boolean; vowel: boolean };

function iterBaseLetters(word: string): BaseLetter[] {
  const out: BaseLetter[] = [];
  let i = 0;
  while (i < word.length) {
    const ch = word[i]!;
    if (HARAKAT.has(ch) || ch === TATWEEL || ch === " ") {
      i += 1;
      continue;
    }
    if (!isArabicLetter(ch) && !"آأإؤئءىةٱ".includes(ch)) {
      i += 1;
      continue;
    }
    let j = i + 1;
    let hasShadda = false;
    let hasSukun = false;
    let hasVowel = false;
    while (j < word.length && HARAKAT.has(word[j]!)) {
      if (word[j] === SHADDA) hasShadda = true;
      else if (word[j] === SUKUN) hasSukun = true;
      else if (VOWEL_MARKS.has(word[j]!)) hasVowel = true;
      j += 1;
    }
    if (hasShadda) {
      out.push({ ch, sukun: true, vowel: false });
      out.push({ ch, sukun: false, vowel: true });
    } else {
      out.push({ ch, sukun: hasSukun, vowel: hasVowel });
    }
    i = j;
  }
  return out;
}

function isAllahWord(bare: string): boolean {
  return ALLAH_FORMS.has(bare) || bare.endsWith("الله") || bare === "الله";
}

function ph(
  char: string,
  kind: Kind,
  fixed: number | null,
  display: boolean,
  wordI: number,
  hint: string,
): Phoneme {
  return { char, kind, fixed, display, wordI, hint };
}

function allahPhonemes(
  word: string,
  wordI: number,
  firstWord: boolean,
  lastWord: boolean,
): Phoneme[] {
  let bare = stripHarakat(word);
  let prefix = "";
  for (const p of ["و", "ب", "ف", "ت", "ل"]) {
    if (bare.startsWith(p + "الله") || bare === p + "له") {
      prefix = p;
      bare = bare.slice(p.length);
      break;
    }
  }
  if (bare === "له") {
    prefix = prefix || "ل";
  }
  const out: Phoneme[] = [];
  if (prefix) out.push(ph(prefix, "cons", 1, true, wordI, "prefix"));
  if (firstWord && !prefix) {
    out.push(ph("ا", "cons", 1, true, wordI, "allah_alif"));
  } else {
    out.push(ph("ا", "wasl", null, true, wordI, "allah_alif"));
  }
  out.push(ph("ل", "cons", 0, true, wordI, "allah_lam1"));
  out.push(ph("ل", "cons", 1, true, wordI, "allah_lam2"));
  if (!lastWord) {
    out.push(ph("ا", "alif_madd", 0, false, wordI, "allah_madd"));
    out.push(ph("ه", "cons", null, true, wordI, "allah_ha"));
  } else {
    out.push(ph("ه", "cons", 0, true, wordI, "allah_ha"));
  }
  return out;
}

function function10(word: string, wordI: number): Phoneme[] {
  let letters = iterBaseLetters(word).map((x) => x.ch);
  if (!letters.length) letters = [...stripHarakat(word)];
  if (letters.length === 1) {
    const ch = letters[0]!;
    if (ALIF_MADD.has(ch) || ch === "ى") return [ph(ch, "alif_madd", 0, true, wordI, "fn")];
    return [ph(ch, "cons", 1, true, wordI, "fn"), ph("", "collapsed", 0, false, wordI, "fn_sukun")];
  }
  const out: Phoneme[] = [];
  letters.forEach((ch, k) => {
    if (k === 0) {
      let kind: Kind = "cons";
      if (ch === WAW) kind = "waw";
      else if (ch === YA || ch === "ى") kind = "ya";
      out.push(ph(ch, kind, 1, true, wordI, "fn10"));
    } else if (ALIF_MADD.has(ch) || ch === "ى" || ch === MADDA_ALIF) {
      out.push(ph(ch === MADDA_ALIF ? "ا" : ch, "alif_madd", 0, true, wordI, "fn10"));
    } else {
      out.push(ph(ch, "cons", 0, true, wordI, "fn10"));
    }
  });
  return out;
}

function pronoun(word: string, wordI: number, lastWord: boolean): Phoneme[] {
  let letters = iterBaseLetters(word).map((x) => x.ch);
  if (!letters.length) letters = [...stripHarakat(word)];
  const out: Phoneme[] = [];
  letters.forEach((ch, k) => {
    const last = lastWord && k === letters.length - 1;
    const fixed = last ? 0 : 1;
    out.push(ph(ch, "cons", fixed, true, wordI, "pron"));
  });
  return out;
}

function applyMaddConstraints(h: Hemistich) {
  const phs = h.phonemes;
  for (let i = 0; i < phs.length; i++) {
    const p = phs[i]!;
    if (p.kind === "alif_madd") {
      let j = i - 1;
      while (j >= 0 && (phs[j]!.kind === "wasl" || phs[j]!.kind === "collapsed")) j -= 1;
      if (j >= 0 && phs[j]!.kind !== "alif_madd") {
        if (phs[j]!.fixed === null) phs[j]!.fixed = 1;
      }
    }
    if (i > 0 && phs[i - 1]!.kind === "alif_madd" && p.fixed === 0) {
      if (p.hint === "allah_ha") continue;
      if (p.kind === "cons" || p.kind === "ta_marbuta" || p.kind === "collapsed") {
        p.kind = "collapsed";
      }
    }
  }
}

export function tokenizeHemistich(text: string): Hemistich {
  const cleaned = cleanLine(text);
  const words = cleaned.split(" ").filter(Boolean);
  const h: Hemistich = { raw: text, cleaned, words, phonemes: [] };
  if (!words.length) return h;

  for (let wi = 0; wi < words.length; wi++) {
    const word = words[wi]!;
    const bare = stripHarakat(word);
    const first = wi === 0;

    if (isAllahWord(bare)) {
      h.phonemes.push(...allahPhonemes(word, wi, first, wi === words.length - 1));
      continue;
    }
    if (FUNCTION_10.has(bare)) {
      h.phonemes.push(...function10(word, wi));
      continue;
    }
    if (PRONOUNS.has(bare)) {
      h.phonemes.push(...pronoun(word, wi, wi === words.length - 1));
      continue;
    }

    const letters = iterBaseLetters(word);
    let idx = 0;
    if (
      letters.length >= 3 &&
      (ALIF_MADD.has(letters[0]!.ch) || "أإٱآ".includes(letters[0]!.ch)) &&
      letters[1]!.ch === LAM
    ) {
      const shamsi = SHAMSI.has(letters[2]!.ch);
      const alifCh = letters[0]!.ch;
      if (alifCh === MADDA_ALIF) {
        h.phonemes.push(ph("آ", "cons", 1, true, wi, "hamza"));
        h.phonemes.push(ph("ا", "alif_madd", 0, true, wi, "madda"));
      } else if (first) {
        h.phonemes.push(ph("ا", "cons", 1, true, wi, "al_alif"));
      } else {
        h.phonemes.push(ph("ا", "wasl", null, true, wi, "al_wasl"));
      }
      if (shamsi) {
        const sham = letters[2]!.ch;
        h.phonemes.push(ph(sham, "cons", 0, true, wi, "shamsi_sukun"));
        h.phonemes.push(ph(sham, "cons", 1, false, wi, "shamsi_move"));
        idx = 3;
      } else {
        h.phonemes.push(ph("ل", "cons", 0, true, wi, "qamari_lam"));
        idx = 2;
      }
    }

    const rest = letters.slice(idx);
    rest.forEach((item, k) => {
      const ch = item.ch;
      const lastOfWord = k === rest.length - 1;
      const lastOfLine = lastOfWord && wi === words.length - 1;
      if (ch === MADDA_ALIF) {
        h.phonemes.push(ph("أ", "cons", 1, true, wi, "madda_h"));
        h.phonemes.push(ph("ا", "alif_madd", 0, true, wi, "madda_a"));
        return;
      }
      if (ALIF_MADD.has(ch)) {
        h.phonemes.push(ph("ا", "alif_madd", 0, true, wi, "madd"));
        return;
      }
      if (ch === "ى") {
        h.phonemes.push(ph("ى", "alif_madd", 0, true, wi, "maqsur"));
        return;
      }
      if (ch === TA_MARBUTA) {
        h.phonemes.push(ph("ة", "ta_marbuta", lastOfLine ? 0 : null, true, wi, "ta"));
        return;
      }
      let kind: Kind = "cons";
      if (ch === WAW) kind = "waw";
      else if (ch === YA) kind = "ya";
      let fixed: number | null = null;
      if (item.sukun) fixed = 0;
      else if (item.vowel) fixed = 1;
      if (lastOfLine) fixed = 0;
      if (kind === "waw" || kind === "ya") {
        if (!lastOfLine && !first && k > 0) {
          if (item.vowel) fixed = 1;
          else if (item.sukun) fixed = 0;
          else fixed = null;
        }
      }
      if (k === 0 && idx === 0 && rest.length === 1 && PREFIX_CONNECT.has(ch) && !lastOfLine) {
        fixed = 1;
      }
      h.phonemes.push(ph(ch, kind, fixed, true, wi, kind));
    });
  }

  if (h.phonemes.length) {
    for (let i = h.phonemes.length - 1; i >= 0; i--) {
      const p = h.phonemes[i]!;
      if (p.display || p.kind !== "collapsed") {
        if (p.kind !== "wasl") p.fixed = 0;
        break;
      }
    }
  }
  applyMaddConstraints(h);
  return h;
}
