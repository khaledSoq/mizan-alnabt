import raw from "./meters.json";
import type { Foot, Meter } from "./types";

const ZIHAF_ALT: Record<string, string[]> = {
  mustafcilun: ["mustafcilun", "mutafcilun", "muftacilun"],
  faulun: ["faulun", "faulu"],
  failun: ["failun", "failun_short"],
  mafailun: ["mafailun", "mafailu"],
};

function cartesian<T>(arrays: T[][]): T[][] {
  return arrays.reduce<T[][]>(
    (acc, curr) => acc.flatMap((a) => curr.map((c) => [...a, c])),
    [[]],
  );
}

let cached: { feet: Record<string, Foot>; meters: Meter[] } | null = null;

export function loadCatalog(): { feet: Record<string, Foot>; meters: Meter[] } {
  if (cached) return cached;
  const feet: Record<string, Foot> = {};
  for (const [k, v] of Object.entries(raw.feet)) {
    feet[k] = {
      key: k,
      bits: v.bits,
      name: v.name,
      laNaam: [...v.la_naam],
      zihaf: "zihaf" in v ? (v as { zihaf?: string }).zihaf : undefined,
    };
  }
  const meters: Meter[] = [];
  for (const m of raw.meters) {
    const meter: Meter = {
      id: m.id,
      name: m.name,
      fasih: m.fasih ?? "",
      priority: m.priority ?? 99,
      footKeys: [...m.feet],
      note: m.note ?? "",
      templates: [],
      templateFeet: [],
    };
    const alts = meter.footKeys.map((fk) => ZIHAF_ALT[fk] ?? [fk]);
    for (const combo of cartesian(alts)) {
      const fs = combo.map((k) => feet[k]!);
      meter.templates.push(fs.map((f) => f.bits).join(""));
      meter.templateFeet.push(fs);
    }
    meters.push(meter);
  }
  meters.sort((a, b) => a.priority - b.priority);
  cached = { feet, meters };
  return cached;
}

export type MeterHit = {
  meter: Meter;
  template: string;
  feet: Foot[];
  score: number;
  hamm: number;
  firstDiff: number | null;
  bits: string;
};

export function scoreBits(seq: string, template: string): {
  score: number;
  hamm: number;
  first: number | null;
} {
  if (!seq && !template) return { score: 0, hamm: 0, first: null };
  const n = Math.max(seq.length, template.length);
  const m = Math.min(seq.length, template.length);
  let hamm = 0;
  let first: number | null = null;
  for (let i = 0; i < m; i++) {
    if (seq[i] !== template[i]) {
      hamm += 1;
      if (first === null) first = i;
    }
  }
  hamm += Math.abs(seq.length - template.length);
  if (seq.length !== template.length && first === null) first = m;
  return { score: 1 - hamm / n, hamm, first };
}

export function bitToBox(index: number, feet: Foot[]): number {
  let acc = 0;
  for (let i = 0; i < feet.length; i++) {
    acc += feet[i]!.bits.length;
    if (index < acc) return i;
  }
  return Math.max(0, feet.length - 1);
}

export function matchCandidate(
  bits: string,
  meters: Meter[],
  selectedId: string | null,
): MeterHit[] {
  const pool =
    selectedId && selectedId !== "auto"
      ? meters.filter((m) => m.id === selectedId)
      : meters;
  const use = pool.length ? pool : meters;
  const hits: MeterHit[] = [];

  for (const meter of use) {
    let best: MeterHit | null = null;
    for (let ti = 0; ti < meter.templates.length; ti++) {
      const tmpl = meter.templates[ti]!;
      const feet = meter.templateFeet[ti]!;
      const candidatesTmpl = [tmpl];
      const allFeet: Foot[][] = [feet];
      let acc = 0;
      const built: Foot[] = [];
      for (const f of feet) {
        built.push(f);
        acc += f.bits.length;
        if (acc < tmpl.length) {
          allFeet.push([...built]);
          candidatesTmpl.push(tmpl.slice(0, acc));
        }
      }
      for (let k = 0; k < candidatesTmpl.length; k++) {
        const t = candidatesTmpl[k]!;
        const fs = allFeet[k]!;
        if (t !== tmpl && Math.abs(bits.length - t.length) > 2) continue;
        if (t !== tmpl && bits.length >= tmpl.length - 1) continue;
        let { score: sc, hamm, first } = scoreBits(bits, t);
        if (t !== tmpl) sc -= 0.04;
        else {
          if (bits.length === t.length) sc += 0.05;
          else if (Math.abs(bits.length - t.length) >= 3) sc -= 0.025 * Math.abs(bits.length - t.length);
        }
        if (bits.slice(0, 2) === "11" && t.slice(0, 2) === "11") sc += 0.05;
        else if (bits.slice(0, 2) === "10" && t.slice(0, 2) === "10") sc += 0.02;
        const nZihaf = fs.filter((f) => f.zihaf).length;
        sc -= 0.055 * nZihaf;
        if (nZihaf >= 2) sc -= 0.05;
        if (fs.length && fs[0] && fs[0].zihaf) sc -= 0.04;
        const hit: MeterHit = {
          meter,
          template: t,
          feet: fs,
          score: sc,
          hamm,
          firstDiff: first,
          bits,
        };
        if (!best || sc > best.score + 1e-9) best = hit;
        else if (best && Math.abs(sc - best.score) < 1e-9 && t.length > best.template.length)
          best = hit;
        else if (
          best &&
          Math.abs(sc - best.score) < 1e-9 &&
          nZihaf < best.feet.filter((f) => f.zihaf).length
        )
          best = hit;
      }
    }
    if (best) hits.push(best);
  }
  hits.sort((a, b) => b.score - a.score || a.meter.priority - b.meter.priority || a.hamm - b.hamm);
  return hits;
}
