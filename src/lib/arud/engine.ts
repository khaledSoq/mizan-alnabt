import { bitToBox, loadCatalog, matchCandidate, type MeterHit } from "./catalog";
import { generate, generateTowards, rescueCandidate } from "./search";
import { splitBayt, tokenizeHemistich } from "./tokenize";
import type {
  AltOut,
  BoxOut,
  Candidate,
  Hemistich,
  HemistichResult,
  LetterOut,
  Meter,
  MeterListItem,
  WeighResult,
} from "./types";

const ACCEPT = 0.9;
const SHORT_MIN = 6;
const CLOSE = 0.03;

function longText(cleaned: string): boolean {
  let n = 0;
  for (const ch of cleaned) if (ch.trim()) n += 1;
  return n > 8;
}

function stamp(r: HemistichResult, src: HemistichResult) {
  if (src.ok && src.message !== "طول غير كاف" && src.meterId && src.meterId !== "auto") {
    r.discoveredMeterId = src.meterId;
    r.discoveredMeterName = src.meterName;
  }
}

function crossScore(bits: string, meterId: string): number {
  if (!bits || !meterId) return 0;
  const { meters } = loadCatalog();
  const hits = matchCandidate(bits, meters, meterId);
  return hits.length ? hits[0]!.score : 0;
}

function closeIds(board: Record<string, HemistichResult>): string[] {
  const scores = Object.values(board)
    .filter((r) => r.ok && r.bits)
    .map((r) => r.score);
  if (!scores.length) return [];
  const best = Math.max(...scores);
  return Object.entries(board)
    .filter(([, r]) => r.ok && r.bits && r.score >= ACCEPT && best - r.score < CLOSE - 1e-12)
    .map(([id]) => id);
}

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
    discoveredMeterId: "",
    discoveredMeterName: "",
  };
}

function lettersFor(h: Hemistich, cand: Candidate): LetterOut[] {
  const out: LetterOut[] = [];
  h.phonemes.forEach((p, i) => {
    const a = cand.assign[i] ?? -1;
    if (!p.display && a === -1) return;
    if (p.kind === "alif_madd" && a === -1 && p.display) {
      let moraBit: number | null = null;
      if (i + 1 < h.phonemes.length && h.phonemes[i + 1]!.hint === "madd_mora") {
        moraBit = i + 1 < cand.assign.length ? (cand.assign[i + 1] ?? -1) : -1;
      }
      if (moraBit === 1) {
        out.push({
          char: p.char || "ا",
          bit: 0,
          skipped: false,
          kind: p.kind,
          wordI: p.wordI,
          locked: true,
          shadda: false,
        });
      } else {
        out.push({
          char: p.char || "ا",
          bit: null,
          skipped: true,
          kind: p.kind,
          wordI: p.wordI,
          locked: true,
          shadda: false,
        });
      }
      return;
    }
    if (!p.display && (a === 0 || a === 1)) return;
    let shadda = false;
    if (i > 0) {
      const prev = h.phonemes[i - 1]!;
      const prevA = cand.assign[i - 1] ?? -1;
      if (!prev.display && (prev.hint === "user_shadda" || prev.hint === "shamsi_sukun") && prevA === 0 && a === 1) {
        shadda = prev.hint === "user_shadda";
      }
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

function directedCandidates(h: Hemistich, meters: Meter[], selectedId: string | null): Candidate[] {
  const pool = selectedId && selectedId !== "auto" ? meters.filter((m) => m.id === selectedId) : meters;
  const use = pool.length ? pool : meters;
  const out: Candidate[] = [];
  const seen = new Set<string>();
  for (const meter of use) {
    for (let ti = 0; ti < meter.templates.length; ti++) {
      const tmpl = meter.templates[ti]!;
      const feet = meter.templateFeet[ti]!;
      if (meter.id === "mashub" && feet.some((f) => f.key === "muftacilun")) continue;
      for (const c of generateTowards(h, tmpl)) {
        if (seen.has(c.bits)) continue;
        seen.add(c.bits);
        out.push(c);
      }
    }
  }
  out.sort((a, b) => a.cost - b.cost || b.bits.length - a.bits.length);
  return out;
}

export function weighHemistich(
  text: string,
  meterId = "auto",
  locks?: Record<number, number>,
  promoteExact = true,
): HemistichResult {
  const { meters } = loadCatalog();
  const h = tokenizeHemistich(text);
  applyLocks(h, locks);
  const mode: "discover" | "check" = meterId === "" || meterId === "auto" ? "discover" : "check";
  const nDisp = h.phonemes.filter((p) => p.display).length;

  if (!h.phonemes.length || nDisp < 2) {
    return emptyResult(text, h.cleaned, meterId, mode, "طول غير كاف");
  }

  let cands = directedCandidates(h, meters, mode === "discover" ? null : meterId);
  if (!cands.length) cands = generate(h);
  if (!cands.length && longText(h.cleaned)) cands = rescueCandidate(h);
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
  let bestRaw = -1;
  const ranked: { hit: MeterHit; cand: Candidate; raw: number }[] = [];
  for (const c of cands.slice(0, 400)) {
    const hits = matchCandidate(c.bits, meters, selected);
    if (!hits.length) continue;
    const h0 = hits[0]!;
    const raw = h0.score;
    h0.score = h0.score - 0.002 * c.cost;
    ranked.push({ hit: h0, cand: c, raw });
    const pri = h0.meter.priority;
    const bestPri = bestHit?.meter.priority ?? 99;
    if (!bestHit || raw > bestRaw + 1e-12) {
      bestHit = h0;
      bestCand = c;
      bestRaw = raw;
    } else if (bestHit && Math.abs(raw - bestRaw) < 1e-9) {
      if (pri < bestPri || (pri === bestPri && c.cost < (bestCand?.cost ?? 1e9))) {
        bestHit = h0;
        bestCand = c;
        bestRaw = raw;
      }
    }
  }

  if (mode === "discover" && bestHit && bestHit.meter.id === "hida") {
    let altHit: MeterHit | null = null;
    let altCand: Candidate | null = null;
    let altRaw = -1;
    for (const row of ranked) {
      if (row.hit.meter.id !== "mashub" || !row.cand.bits.endsWith("1011010")) continue;
      if (row.raw + 1e-12 < bestRaw - CLOSE) continue;
      if (
        !altHit ||
        row.raw > altRaw + 1e-12 ||
        (Math.abs(row.raw - altRaw) < 1e-9 && altCand && row.cand.cost < altCand.cost)
      ) {
        altHit = row.hit;
        altCand = row.cand;
        altRaw = row.raw;
      }
    }
    if (altHit && altCand) {
      bestHit = altHit;
      bestCand = altCand;
      bestRaw = altRaw;
    }
  }

  if (mode === "check" && promoteExact && ranked.length) {
    let exactHit: MeterHit | null = null;
    let exactCand: Candidate | null = null;
    let exactLen = -1;
    let exactRaw = -1;
    for (const row of ranked) {
      if (row.hit.hamm !== 0 || row.cand.bits.length !== row.hit.template.length) continue;
      if (!row.hit.meter.templates.includes(row.hit.template)) continue;
      if (
        !exactHit ||
        row.hit.template.length > exactLen ||
        (row.hit.template.length === exactLen && row.raw > exactRaw + 1e-12)
      ) {
        exactHit = row.hit;
        exactCand = row.cand;
        exactLen = row.hit.template.length;
        exactRaw = row.raw;
      }
    }
    if (exactHit && exactCand) {
      exactHit.score = Math.max(exactHit.score, 0.97);
      if (!bestHit || exactHit.score >= bestHit.score - 1e-12) {
        bestHit = exactHit;
        bestCand = exactCand;
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
    discoveredMeterId: "",
    discoveredMeterName: "",
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
  const hemistichs: HemistichResult[] = [];
  const discBits: string[] = [];
  const selectedMode = !(meterId === "" || meterId === "auto");
  const { meters } = loadCatalog();
  const pri = new Map(meters.map((m) => [m.id, m.priority]));

  if (!selectedMode && parts.length === 2) {
    const boards = parts.map((p, i) => {
      const board: Record<string, HemistichResult> = {};
      for (const m of meters) board[m.id] = weighHemistich(p, m.id, locks?.[i], false);
      return board;
    });
    const left = new Set(closeIds(boards[0]!));
    const inter = closeIds(boards[1]!).filter((id) => left.has(id));
    if (inter.length) {
      inter.sort((a, b) => (pri.get(a) ?? 99) - (pri.get(b) ?? 99) || a.localeCompare(b));
      const chosen = inter[0]!;
      for (const board of boards) {
        const r = board[chosen]!;
        r.mode = "discover";
        if (r.ok && r.accepted) r.message = "موزون";
        else if (r.ok && r.message !== "طول غير كاف") r.message = "أقرب بحر — المطابقة دون العتبة";
        stamp(r, r);
        hemistichs.push(r);
        discBits.push(r.bits);
      }
    } else {
      parts.forEach((p, i) => {
        const checked = weighHemistich(p, "auto", locks?.[i]);
        stamp(checked, checked);
        hemistichs.push(checked);
        discBits.push(checked.bits);
      });
    }
  } else {
    parts.forEach((p, i) => {
      const checked = weighHemistich(p, meterId, locks?.[i]);
      const disc = selectedMode ? weighHemistich(p, "auto", locks?.[i]) : checked;
      stamp(checked, disc);
      hemistichs.push(checked);
      discBits.push(disc.bits || checked.bits);
    });
  }

  const comparable = (h: HemistichResult) =>
    h.ok && h.message !== "طول غير كاف" && !!h.discoveredMeterId;
  let mixed = false;
  if (hemistichs.length === 2 && comparable(hemistichs[0]!) && comparable(hemistichs[1]!)) {
    if (hemistichs[0]!.discoveredMeterId !== hemistichs[1]!.discoveredMeterId) {
      const suppressed = selectedMode && hemistichs.every((r) => r.accepted);
      if (!suppressed) {
        const c0 = crossScore(discBits[0] || "", hemistichs[1]!.discoveredMeterId || "");
        const c1 = crossScore(discBits[1] || "", hemistichs[0]!.discoveredMeterId || "");
        if (c0 < ACCEPT && c1 < ACCEPT) mixed = true;
      }
    }
  }
  const same = !mixed;
  let overall = hemistichs.length && hemistichs.every((r) => r.accepted) ? "موزون" : "راجع الكسر";
  if (mixed) overall = "شطران على بحرين مختلفين";
  else if (hemistichs.length === 1 && hemistichs[0] && !hemistichs[0].ok && hemistichs[0].message === "طول غير كاف") {
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
