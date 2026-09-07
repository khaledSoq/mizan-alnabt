import type { Candidate, Hemistich, Phoneme } from "./types";

const MAX_CANDIDATES = 3000;
const MAX_EXPANSIONS = 12000;
const MAX_BITS = 32;

function nextReal(ph: Phoneme[], i: number): Phoneme | null {
  let j = i + 1;
  while (j < ph.length && ph[j]!.kind === "collapsed" && ph[j]!.hint !== "madd_mora") j += 1;
  return j < ph.length ? ph[j]! : null;
}

function choices(p: Phoneme, ph: Phoneme[], i: number, state: number, assign: number[]): number[] {
  if (p.kind === "wasl") {
    if (p.fixed === 1) return [1];
    if (p.fixed === 0) return [-1];
    if (i > 0 && ph[i - 1]!.hint === "ta_wasl") return [-1];
    if (state === 0) {
      const nxt = nextReal(ph, i);
      if (nxt !== null && nxt.fixed === 0) return [1];
    }
    return [-1, 1];
  }
  if (p.kind === "collapsed") return [-1];
  if (p.hint === "allah_madd") return [-1, 0];
  if (p.hint === "madd_mora") {
    const prevA = assign.length ? assign[assign.length - 1]! : 0;
    if (prevA === 0) return [-1];
    return [1, -1];
  }
  if (p.kind === "alif_madd") {
    const nxt = i + 1 < ph.length ? ph[i + 1]! : null;
    if (nxt !== null && nxt.hint === "madd_mora") return [0, -1];
    if (i > 0 && ph[i - 1]!.hint === "foldable") {
      const prevA = assign.length ? assign[assign.length - 1]! : 1;
      if (prevA === -1) return [-1];
      return [0];
    }
    return [0];
  }
  if (p.hint === "tanwin") return [-1, 0, 1];
  if (p.hint === "foldable") return [1, -1];
  if (p.fixed !== null) return [p.fixed];
  if (p.kind === "waw" || p.kind === "ya") return [0, 1];
  return [1, 0];
}

function extra(p: Phoneme, ch: number, ph: Phoneme[], i: number, assign: number[]): number {
  let e = 0;
  if (p.kind === "cons" && p.fixed === null && ch === 0 && p.hint !== "madd_mora" && p.hint !== "foldable") {
    e += 1;
  }
  if ((p.kind === "waw" || p.kind === "ya") && p.fixed === null && ch === 1) {
    const between =
      i > 0 &&
      i + 1 < ph.length &&
      ph[i - 1]!.kind === "cons" &&
      (ph[i + 1]!.kind === "cons" || ph[i + 1]!.kind === "ta_marbuta");
    e += between ? 0.05 : 0.35;
  }
  if (p.kind === "wasl" && ch === 1) e += 0.4;
  if (p.kind === "wasl" && ch === -1) e += 0.15;
  if (p.kind === "ta_marbuta" && ch === 1 && p.hint !== "ta_wasl") e += 0.8;
  if (p.hint === "foldable" && ch === -1) e += 0.25;
  if (p.hint === "tanwin" && ch !== -1) e += 0.7;
  if (p.hint === "allah_ha" && ch === 1 && assign.length) {
    const prev = ph[i - 1]!;
    if (prev.hint === "allah_madd" && assign[assign.length - 1] === -1) e += 0.6;
  }
  if (ch === 0 && assign.length) {
    const prev = ph[i - 1]!;
    if (prev.hint === "allah_ha" && assign[assign.length - 1] === 1) e += 0.85;
  }
  return e;
}

function trans(state: number, bit: number): number | null {
  if (bit !== 0 && bit !== 1) return null;
  if (state === 0) return bit === 1 ? 1 : null;
  if (state === 1) return bit === 0 ? 0 : 2;
  if (state === 2) return bit === 0 ? 0 : null;
  return null;
}

export function bitsToLaNaam(bits: string): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < bits.length) {
    if (bits.startsWith("110", i)) {
      out.push("نعم");
      i += 3;
    } else if (bits.startsWith("10", i)) {
      out.push("لا");
      i += 2;
    } else break;
  }
  return out;
}

type Node = {
  cost: number;
  seq: number;
  i: number;
  ti: number;
  bits: string;
  state: number;
  assign: number[];
};

class MinHeap {
  data: Node[] = [];
  less(a: Node, b: Node) {
    if (a.cost !== b.cost) return a.cost < b.cost;
    return a.seq < b.seq;
  }
  push(n: Node) {
    this.data.push(n);
    this.up(this.data.length - 1);
  }
  pop(): Node | undefined {
    if (!this.data.length) return undefined;
    const top = this.data[0]!;
    const last = this.data.pop()!;
    if (this.data.length) {
      this.data[0] = last;
      this.down(0);
    }
    return top;
  }
  up(i: number) {
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (!this.less(this.data[i]!, this.data[p]!)) break;
      [this.data[i], this.data[p]] = [this.data[p]!, this.data[i]!];
      i = p;
    }
  }
  down(i: number) {
    const n = this.data.length;
    for (;;) {
      let s = i;
      const l = i * 2 + 1;
      const r = l + 1;
      if (l < n && this.less(this.data[l]!, this.data[s]!)) s = l;
      if (r < n && this.less(this.data[r]!, this.data[s]!)) s = r;
      if (s === i) break;
      [this.data[i], this.data[s]] = [this.data[s]!, this.data[i]!];
      i = s;
    }
  }
}

export function generate(h: Hemistich): Candidate[] {
  const ph = h.phonemes;
  if (!ph.length) return [];
  const results: Candidate[] = [];
  const seen = new Set<string>();
  let seq = 0;
  let expansions = 0;
  const heap = new MinHeap();
  heap.push({ cost: 0, seq: 0, i: 0, ti: 0, bits: "", state: 0, assign: [] });

  while (heap.data.length && results.length < MAX_CANDIDATES && expansions < MAX_EXPANSIONS) {
    const node = heap.pop()!;
    expansions += 1;
    if (node.i === ph.length) {
      if (node.state === 0 && node.bits.endsWith("0") && !seen.has(node.bits)) {
        if (node.bits.length >= 4 && node.bits.length <= MAX_BITS) {
          seen.add(node.bits);
          results.push({
            bits: node.bits,
            assign: node.assign,
            cost: node.cost,
            laNaam: bitsToLaNaam(node.bits),
          });
        }
      }
      continue;
    }
    const p = ph[node.i]!;
    for (const ch of choices(p, ph, node.i, node.state, node.assign)) {
      if (ch === -1) {
        heap.push({
          cost: node.cost + extra(p, ch, ph, node.i, node.assign),
          seq: seq++,
          i: node.i + 1,
          ti: node.ti,
          bits: node.bits,
          state: node.state,
          assign: node.assign.concat(-1),
        });
        continue;
      }
      const newState = trans(node.state, ch);
      if (newState === null) continue;
      if (node.bits.length + 1 > MAX_BITS) continue;
      heap.push({
        cost: node.cost + extra(p, ch, ph, node.i, node.assign),
        seq: seq++,
        i: node.i + 1,
        ti: node.ti,
        bits: node.bits + String(ch),
        state: newState,
        assign: node.assign.concat(ch),
      });
    }
  }
  results.sort((a, b) => a.cost - b.cost || b.bits.length - a.bits.length);
  return results;
}

export function generateTowards(h: Hemistich, template: string): Candidate[] {
  const ph = h.phonemes;
  if (!ph.length || !template) return [];
  const results: Candidate[] = [];
  const seen = new Set<string>();
  let seq = 0;
  let expansions = 0;
  const heap = new MinHeap();
  heap.push({ cost: 0, seq: 0, i: 0, ti: 0, bits: "", state: 0, assign: [] });
  const n = ph.length;
  const tlen = template.length;

  while (heap.data.length && results.length < 80 && expansions < MAX_EXPANSIONS) {
    const node = heap.pop()!;
    expansions += 1;
    if (node.i === n) {
      if (node.ti === tlen && node.state === 0 && !seen.has(node.bits)) {
        if (node.bits.endsWith("0")) {
          seen.add(node.bits);
          results.push({
            bits: node.bits,
            assign: node.assign,
            cost: node.cost,
            laNaam: bitsToLaNaam(node.bits),
          });
        }
      }
      continue;
    }
    const p = ph[node.i]!;
    const remainPh = n - node.i;
    const remainT = tlen - node.ti;
    for (const ch of choices(p, ph, node.i, node.state, node.assign)) {
      if (ch === -1) {
        heap.push({
          cost: node.cost + extra(p, ch, ph, node.i, node.assign),
          seq: seq++,
          i: node.i + 1,
          ti: node.ti,
          bits: node.bits,
          state: node.state,
          assign: node.assign.concat(-1),
        });
        continue;
      }
      if (node.ti >= tlen) continue;
      if (String(ch) !== template[node.ti]) continue;
      const newState = trans(node.state, ch);
      if (newState === null) continue;
      const heur = Math.max(0, remainT - 1 - (remainPh - 1)) * 0.01;
      heap.push({
        cost: node.cost + extra(p, ch, ph, node.i, node.assign) + heur,
        seq: seq++,
        i: node.i + 1,
        ti: node.ti + 1,
        bits: node.bits + String(ch),
        state: newState,
        assign: node.assign.concat(ch),
      });
    }
  }
  results.sort((a, b) => a.cost - b.cost || b.bits.length - a.bits.length);
  return results;
}
