import { bitToBox, loadCatalog, matchCandidate, type MeterHit } from "./catalog";
import { generate } from "./search";
import { splitBayt, tokenizeHemistich } from "./tokenize";
import type {
  AltOut,
  BoxOut,
  Candidate,
  Hemistich,
  HemistichResult,
  LetterOut,
  MeterListItem,
  WeighResult,
} from "./types";

const ACCEPT = 0.9;
const SHORT_MIN = 6;

function emptyResult(
  text: string,
  cleaned: string,
  meterId: string,
  mode: "discover" | "check",
  message: string,
  letters: LetterOut[] = [],
  bits = "",
  laNaam: string[] = [],
): HemistichResult {
  return {
    ok: false,
    message,
    text,
    cleaned,
    meterId,
    meterName: "",
    fasih: "",
    score: 0,
    accepted: false,
    bits,
    laNaam,
    letters,
    boxes: [],
    firstDiff: null,
    brokenBox: null,
    alts: [],
    mode,
  };
}

function lettersFor(h: Hemistich, cand: Candidate): LetterOut[] {
  const out: LetterOut[] = [];
  h.phonemes.forEach((p, i) => {
    const a = cand.assign[i] ?? -1;
    if (!p.display && a === -1) return;
    if (!p.display && (a === 0 || a === 1)) return;
    let shadda = false;
    if (i > 0) {
      const prev = h.phonemes[i - 1]!;
      const prevA = cand.assign[i - 1] ?? -1;
      if (prev.hint === "user_shadda" && prevA === 0) shadda = true;
    }
    out.push({
      char: p.char || "·",
      bit: a === -1 ? null : a,
      skipped: a === -1,
      kind: p.kind,
      wordI: p.wordI,
      locked: p.fixed !== null && p.kind !== "wasl",
      shadda,
    });
  });
  return out;
}

function boxesOf(hit: MeterHit): { boxes: BoxOut[]; brokenBox: number | null } {
  let brokenBox: number | null = null;
  if (hit.firstDiff !== null) brokenBox = bitToBox(hit.firstDiff, hit.feet);
  const boxes = hit.feet.map((f, i) => ({
    index: i,
    name: f.name,
    laNaam: [...f.laNaam],
    bits: f.bits,
    broken: brokenBox === i && hit.score < ACCEPT,
    zihaf: f.zihaf ?? null,
  }));
  return { boxes, brokenBox };
}

function applyLocks(h: Hemistich, locks: Record<number, number> | undefined) {
  if (!locks) return;
  const shownMap: number[] = [];
  for (let i = 0; i < h.phonemes.length; i++) {
    if (h.phonemes[i]!.display) shownMap.push(i);
  }
  const items: [number, number][] = Object.keys(locks).map((k) => [Number(k), Number(locks[Number(k)])]);
  items.sort((a, b) => b[0] - a[0]);
  for (let n = 0; n < items.length; n++) {
    const shown = items[n]![0];
    const bit = items[n]![1];
    if (shown < 0 || shown >= shownMap.length) continue;
    const pi = shownMap[shown]!;
    const p = h.phonemes[pi]!;
    if (bit === 2) {
      const hidden = {
        char: p.char,
        kind: "cons" as const,
        fixed: 0 as const,
        display: false,
        wordI: p.wordI,
        hint: "user_shadda",
      };
      if (p.kind === "waw" || p.kind === "ya" || p.kind === "alif_madd" || p.kind === "wasl" || p.kind === "collapsed") {
        p.kind = "cons";
      }
      p.fixed = 1;
      p.hint = "user_shadda_move";
      h.phonemes.splice(pi, 0, hidden);
      continue;
    }
    if (bit === 0 || bit === 1) {
      if (p.kind === "wasl" && bit === 0) {
        p.kind = "collapsed";
        p.fixed = 0;
        p.hint = "user_drop";
      } else if (p.kind === "collapsed") {
        if (bit === 1) {
          p.kind = "cons";
          p.fixed = 1;
          p.hint = "user";
        }
      } else {
        p.fixed = bit;
        p.hint = "user";
      }
    }
  }
}

export function weighHemistich(
  text: string,
  meterId = "auto",
  locks?: Record<number, number>,
): HemistichResult {
  const { meters } = loadCatalog();
  const h = tokenizeHemistich(text);
  applyLocks(h, locks);
  const mode: "discover" | "check" = meterId === "" || meterId === "auto" ? "discover" : "check";
  const nDisp = h.phonemes.filter((p) => p.display).length;

  if (!h.phonemes.length || nDisp < 2) {
    return emptyResult(text, h.cleaned, meterId, mode, "طول غير كاف");
  }

  const cands = generate(h);
  if (!cands.length) {
    const letters: LetterOut[] = h.phonemes
      .filter((p) => p.display)
      .map((p) => ({
        char: p.char || "·",
        bit: p.fixed === 0 || p.fixed === 1 ? p.fixed : null,
        skipped: false,
        kind: p.kind,
        wordI: p.wordI,
        locked: p.fixed !== null,
      }));
    return emptyResult(
      text,
      h.cleaned,
      meterId,
      mode,
      nDisp < 6
        ? "طول غير كاف"
        : "لا تقطيع يتجمّع إلى أسباب وأوتاد (10 و 110). اضغط حرفاً لقلب السكون.",
      letters,
    );
  }

  if (Math.max(...cands.map((c) => c.bits.length)) < SHORT_MIN) {
    return emptyResult(
      text,
      h.cleaned,
      meterId,
      mode,
      "طول غير كاف",
      lettersFor(h, cands[0]!),
      cands[0]!.bits,
      cands[0]!.laNaam,
    );
  }

  const selected = mode === "discover" ? null : meterId;
  let bestHit: MeterHit | null = null;
  let bestCand: Candidate | null = null;
  const ranked: { hit: MeterHit; cand: Candidate }[] = [];
  for (const c of cands.slice(0, 400)) {
    const hits = matchCandidate(c.bits, meters, selected);
    if (!hits.length) continue;
    const h0 = hits[0]!;
    h0.score = h0.score - 0.002 * c.cost;
    ranked.push({ hit: h0, cand: c });
    if (!bestHit || h0.score > bestHit.score + 1e-12) {
      bestHit = h0;
      bestCand = c;
    } else if (bestHit && Math.abs(h0.score - bestHit.score) < 1e-9) {
      if (c.cost < (bestCand?.cost ?? 1e9)) {
        bestHit = h0;
        bestCand = c;
      }
    }
  }

  if (!bestHit || !bestCand) {
    return emptyResult(text, h.cleaned, meterId, mode, "طول غير كاف");
  }

  const alts: AltOut[] = [];
  const seenBits = new Set([bestCand.bits]);
  const sorted = [...ranked].sort((a, b) => b.hit.score - a.hit.score);
  for (const { hit, cand } of sorted) {
    if (seenBits.has(cand.bits)) continue;
    if (hit.score >= bestHit.score - 0.08 && alts.length < 3) {
      let note = "";
      if (cand.bits.startsWith("1010110") || cand.bits === "1010110") note = "هجر ساكنة → مستفعلن";
      if (cand.bits.endsWith("1011010") || cand.bits === "1011010") note = "هجر مفتوحة → فاعلاتن";
      alts.push({
        bits: cand.bits,
        laNaam: cand.laNaam,
        meterName: hit.meter.name,
        score: Math.round(hit.score * 10000) / 10000,
        note,
      });
      seenBits.add(cand.bits);
    }
  }

  const { boxes, brokenBox } = boxesOf(bestHit);
  const accepted = bestHit.score >= ACCEPT;
  const message =
    mode === "check"
      ? accepted
        ? "موزون"
        : "مكسور"
      : accepted
        ? "موزون"
        : "أقرب بحر — المطابقة دون العتبة";

  return {
    ok: true,
    message,
    text,
    cleaned: h.cleaned,
    meterId: bestHit.meter.id,
    meterName: bestHit.meter.name,
    fasih: bestHit.meter.fasih,
    score: Math.round(Math.min(1, Math.max(0, bestHit.score)) * 10000) / 10000,
    accepted,
    bits: bestCand.bits,
    laNaam: bestCand.laNaam,
    letters: lettersFor(h, bestCand),
    boxes,
    firstDiff: bestHit.firstDiff,
    brokenBox: accepted ? null : brokenBox,
    alts,
    mode,
  };
}

export function meterList(): MeterListItem[] {
  const { meters } = loadCatalog();
  const out: MeterListItem[] = [{ id: "auto", name: "تلقائي", feet: [], bits: "" }];
  for (const m of meters) {
    out.push({
      id: m.id,
      name: m.name,
      fasih: m.fasih,
      feet: m.templateFeet[0]?.map((f) => f.name) ?? [],
      bits: m.templates[0] ?? "",
      note: m.note,
    });
  }
  return out;
}

export function weigh(
  text: string,
  meterId = "auto",
  locks?: Array<Record<number, number> | undefined>,
): WeighResult {
  const parts = splitBayt(text);
  if (!parts.length) {
    return {
      ok: false,
      message: "أدخل صدراً أو عجزاً أو بيتاً مفصولاً بنجمة أو سطر.",
      hemistichs: [],
      meters: meterList(),
      mode: meterId === "auto" || !meterId ? "discover" : "check",
      selected: meterId,
    };
  }
  const hemistichs = parts.map((p, i) => weighHemistich(p, meterId, locks?.[i]));
  const names = hemistichs.filter((r) => r.ok && r.meterName).map((r) => r.meterName);
  const same = new Set(names).size <= 1;
  let overall = hemistichs.length && hemistichs.every((r) => r.accepted) ? "موزون" : "راجع الكسر";
  if (hemistichs.length === 1 && hemistichs[0] && !hemistichs[0].ok && hemistichs[0].message === "طول غير كاف") {
    overall = "طول غير كاف";
  }
  return {
    ok: true,
    message: overall,
    sameMeter: same,
    hemistichs,
    meters: meterList(),
    mode: meterId === "auto" || !meterId ? "discover" : "check",
    selected: meterId,
  };
}
