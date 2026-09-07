"use strict";
var Arud = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  // src/lib/arud/index.ts
  var index_exports = {};
  __export(index_exports, {
    meterList: () => meterList,
    splitBayt: () => splitBayt,
    weigh: () => weigh,
    weighHemistich: () => weighHemistich
  });

  // src/lib/arud/meters.json
  var meters_default = {
    feet: {
      mustafcilun: { bits: "1010110", name: "\u0645\u0633\u062A\u0641\u0639\u0644\u0646", la_naam: ["\u0644\u0627", "\u0644\u0627", "\u0646\u0639\u0645"] },
      mutafcilun: { bits: "110110", name: "\u0645\u062A\u0641\u0639\u0644\u0646", la_naam: ["\u0646\u0639\u0645", "\u0644\u0627", "\u0646\u0639\u0645"], zihaf_of: "mustafcilun", zihaf: "\u062E\u0628\u0646" },
      muftacilun: { bits: "101110", name: "\u0645\u0641\u062A\u0639\u0644\u0646", la_naam: ["\u0644\u0627", "\u0646\u0639\u0645", "\u0646\u0639\u0645"], zihaf_of: "mustafcilun", zihaf: "\u0637\u064A" },
      failun: { bits: "10110", name: "\u0641\u0627\u0639\u0644\u0646", la_naam: ["\u0644\u0627", "\u0646\u0639\u0645"] },
      failatun: { bits: "1011010", name: "\u0641\u0627\u0639\u0644\u0627\u062A\u0646", la_naam: ["\u0644\u0627", "\u0646\u0639\u0645", "\u0644\u0627"] },
      faulun: { bits: "11010", name: "\u0641\u0639\u0648\u0644\u0646", la_naam: ["\u0646\u0639\u0645", "\u0644\u0627"] },
      faulu: { bits: "1110", name: "\u0641\u0639\u0648\u0644", la_naam: ["\u0646\u0639\u0645"], zihaf_of: "faulun", zihaf: "\u0642\u0628\u0636" },
      mafailun: { bits: "1101010", name: "\u0645\u0641\u0627\u0639\u064A\u0644\u0646", la_naam: ["\u0646\u0639\u0645", "\u0644\u0627", "\u0644\u0627"] },
      mafailu: { bits: "110110", name: "\u0645\u0641\u0627\u0639\u0644\u0646", la_naam: ["\u0646\u0639\u0645", "\u0646\u0639\u0645"], zihaf_of: "mafailun", zihaf: "\u0642\u0628\u0636" },
      failun_short: { bits: "1010", name: "\u0641\u0639\u0644\u0646", la_naam: ["\u0644\u0627", "\u0644\u0627"], zihaf_of: "failun", zihaf: "\u062E\u0628\u0646" }
    },
    meters: [
      {
        id: "mashub",
        name: "\u0627\u0644\u0645\u0633\u062D\u0648\u0628",
        fasih: "\u0627\u0644\u0633\u0631\u064A\u0639",
        priority: 1,
        feet: ["mustafcilun", "mustafcilun", "failatun"],
        note: "\u0623\u0643\u062B\u0631 \u0628\u062D\u0631 \u0646\u0628\u0637\u064A. \u0645\u0633\u062A\u0641\u0639\u0644\u0646 \u0645\u0633\u062A\u0641\u0639\u0644\u0646 \u0641\u0627\u0639\u0644\u0627\u062A\u0646."
      },
      {
        id: "arda",
        name: "\u0627\u0644\u0639\u0631\u0636\u0629",
        fasih: "\u0627\u0644\u0631\u0645\u0644",
        priority: 2,
        feet: ["failatun", "failatun", "failun"],
        note: "\u0628\u062D\u0631 \u0627\u0644\u0637\u0628\u0644 \u0648\u0627\u0644\u0633\u0644\u0627\u062D. \u0641\u0627\u0639\u0644\u0627\u062A\u0646 \u0641\u0627\u0639\u0644\u0627\u062A\u0646 \u0641\u0627\u0639\u0644\u0646."
      },
      {
        id: "hajini_tamm",
        name: "\u0627\u0644\u0647\u062C\u064A\u0646\u064A \u0627\u0644\u062A\u0627\u0645",
        fasih: "\u0645\u062C\u0632\u0648\u0621 \u0627\u0644\u0628\u0633\u064A\u0637",
        priority: 3,
        feet: ["mustafcilun", "failun", "mustafcilun", "failun"],
        note: "\u0645\u0633\u062A\u0641\u0639\u0644\u0646 \u0641\u0627\u0639\u0644\u0646 \u0645\u0633\u062A\u0641\u0639\u0644\u0646 \u0641\u0627\u0639\u0644\u0646."
      },
      {
        id: "hajini_qasir",
        name: "\u0627\u0644\u0647\u062C\u064A\u0646\u064A \u0627\u0644\u0642\u0635\u064A\u0631",
        fasih: "\u0645\u062C\u0632\u0648\u0621 \u0627\u0644\u0628\u0633\u064A\u0637",
        priority: 4,
        feet: ["mustafcilun", "failun", "failun"],
        note: "\u0645\u0633\u062A\u0641\u0639\u0644\u0646 \u0641\u0627\u0639\u0644\u0646 \u0641\u0627\u0639\u0644\u0646."
      },
      {
        id: "hilali",
        name: "\u0627\u0644\u0647\u0644\u0627\u0644\u064A",
        fasih: "\u0627\u0644\u0637\u0648\u064A\u0644",
        priority: 5,
        feet: ["faulun", "mafailun", "faulun", "mafailun"],
        note: "\u0641\u0639\u0648\u0644\u0646 \u0645\u0641\u0627\u0639\u064A\u0644\u0646 \u0641\u0639\u0648\u0644\u0646 \u0645\u0641\u0627\u0639\u064A\u0644\u0646. \u0627\u0644\u0639\u0631\u0648\u0636 \u0643\u062B\u064A\u0631\u0627\u064B \u0645\u0641\u0627\u0639\u0644\u0646."
      },
      {
        id: "sakhri",
        name: "\u0627\u0644\u0635\u062E\u0631\u064A",
        fasih: "\u0627\u0644\u0647\u0632\u062C / \u0627\u0644\u0648\u0627\u0641\u0631",
        priority: 6,
        feet: ["mafailun", "mafailun", "faulun"],
        note: "\u0645\u0641\u0627\u0639\u064A\u0644\u0646 \u0645\u0641\u0627\u0639\u064A\u0644\u0646 \u0641\u0639\u0648\u0644\u0646."
      },
      {
        id: "hida",
        name: "\u0627\u0644\u062D\u062F\u0627\u0621",
        fasih: "\u0627\u0644\u0631\u062C\u0632",
        priority: 7,
        feet: ["mustafcilun", "mustafcilun", "mustafcilun"],
        note: "\u0645\u0633\u062A\u0641\u0639\u0644\u0646 \u062B\u0644\u0627\u062B \u0645\u0631\u0627\u062A."
      },
      {
        id: "madid",
        name: "\u0627\u0644\u0645\u062F\u064A\u062F",
        fasih: "\u0627\u0644\u0645\u062F\u064A\u062F",
        priority: 8,
        feet: ["failatun", "failun", "failatun", "failun"],
        note: "\u0641\u0627\u0639\u0644\u0627\u062A\u0646 \u0641\u0627\u0639\u0644\u0646 \u0641\u0627\u0639\u0644\u0627\u062A\u0646 \u0641\u0627\u0639\u0644\u0646."
      },
      {
        id: "mumtadd",
        name: "\u0627\u0644\u0645\u0645\u062A\u062F",
        fasih: "\u0627\u0644\u0631\u0645\u0644 \u0627\u0644\u062A\u0627\u0645",
        priority: 9,
        feet: ["failatun", "failatun", "failatun", "failun"],
        note: "\u0641\u0627\u0639\u0644\u0627\u062A\u0646 \u0641\u0627\u0639\u0644\u0627\u062A\u0646 \u0641\u0627\u0639\u0644\u0627\u062A\u0646 \u0641\u0627\u0639\u0644\u0646."
      }
    ]
  };

  // src/lib/arud/catalog.ts
  var ZIHAF_ALT = {
    mustafcilun: ["mustafcilun", "mutafcilun", "muftacilun"],
    faulun: ["faulun", "faulu"],
    failun: ["failun", "failun_short"],
    mafailun: ["mafailun", "mafailu"]
  };
  function cartesian(arrays) {
    return arrays.reduce(
      (acc, curr) => acc.flatMap((a) => curr.map((c) => [...a, c])),
      [[]]
    );
  }
  var cached = null;
  function loadCatalog() {
    var _a, _b, _c;
    if (cached) return cached;
    const feet = {};
    for (const [k, v] of Object.entries(meters_default.feet)) {
      feet[k] = {
        key: k,
        bits: v.bits,
        name: v.name,
        laNaam: [...v.la_naam],
        zihaf: "zihaf" in v ? v.zihaf : void 0
      };
    }
    const meters = [];
    for (const m of meters_default.meters) {
      const meter = {
        id: m.id,
        name: m.name,
        fasih: (_a = m.fasih) != null ? _a : "",
        priority: (_b = m.priority) != null ? _b : 99,
        footKeys: [...m.feet],
        note: (_c = m.note) != null ? _c : "",
        templates: [],
        templateFeet: []
      };
      const alts = meter.footKeys.map((fk) => {
        var _a2;
        return (_a2 = ZIHAF_ALT[fk]) != null ? _a2 : [fk];
      });
      for (const combo of cartesian(alts)) {
        const fs = combo.map((k) => feet[k]);
        meter.templates.push(fs.map((f) => f.bits).join(""));
        meter.templateFeet.push(fs);
      }
      meters.push(meter);
    }
    meters.sort((a, b) => a.priority - b.priority);
    cached = { feet, meters };
    return cached;
  }
  function scoreBits(seq, template) {
    if (!seq && !template) return { score: 0, hamm: 0, first: null };
    const n = Math.max(seq.length, template.length);
    const m = Math.min(seq.length, template.length);
    let hamm = 0;
    let first = null;
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
  function bitToBox(index, feet) {
    let acc = 0;
    for (let i = 0; i < feet.length; i++) {
      acc += feet[i].bits.length;
      if (index < acc) return i;
    }
    return Math.max(0, feet.length - 1);
  }
  function matchCandidate(bits, meters, selectedId) {
    const pool = selectedId && selectedId !== "auto" ? meters.filter((m) => m.id === selectedId) : meters;
    const use = pool.length ? pool : meters;
    const hits = [];
    for (const meter of use) {
      let best = null;
      for (let ti = 0; ti < meter.templates.length; ti++) {
        const tmpl = meter.templates[ti];
        const feet = meter.templateFeet[ti];
        const candidatesTmpl = [tmpl];
        const allFeet = [feet];
        let acc = 0;
        const built = [];
        for (const f of feet) {
          built.push(f);
          acc += f.bits.length;
          if (acc < tmpl.length) {
            allFeet.push([...built]);
            candidatesTmpl.push(tmpl.slice(0, acc));
          }
        }
        for (let k = 0; k < candidatesTmpl.length; k++) {
          const t = candidatesTmpl[k];
          const fs = allFeet[k];
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
          const hit = {
            meter,
            template: t,
            feet: fs,
            score: sc,
            hamm,
            firstDiff: first,
            bits
          };
          if (!best || sc > best.score + 1e-9) best = hit;
          else if (best && Math.abs(sc - best.score) < 1e-9 && t.length > best.template.length)
            best = hit;
          else if (best && Math.abs(sc - best.score) < 1e-9 && nZihaf < best.feet.filter((f) => f.zihaf).length)
            best = hit;
        }
      }
      if (best) hits.push(best);
    }
    hits.sort((a, b) => b.score - a.score || a.meter.priority - b.meter.priority || a.hamm - b.hamm);
    return hits;
  }

  // src/lib/arud/search.ts
  var MAX_CANDIDATES = 3e3;
  var MAX_EXPANSIONS = 12e3;
  var MAX_BITS = 32;
  function nextReal(ph2, i) {
    let j = i + 1;
    while (j < ph2.length && ph2[j].kind === "collapsed" && ph2[j].hint !== "madd_mora") j += 1;
    return j < ph2.length ? ph2[j] : null;
  }
  function choices(p, ph2, i, state, assign) {
    if (p.kind === "wasl") {
      if (p.fixed === 1) return [1];
      if (p.fixed === 0) return [-1];
      if (i > 0 && ph2[i - 1].hint === "ta_wasl") return [-1];
      if (state === 0) {
        const nxt = nextReal(ph2, i);
        if (nxt !== null && nxt.fixed === 0) return [1];
      }
      return [-1, 1];
    }
    if (p.kind === "collapsed") return [-1];
    if (p.hint === "allah_madd") return [-1, 0];
    if (p.hint === "madd_mora") {
      const prevA = assign.length ? assign[assign.length - 1] : 0;
      if (prevA === 0) return [-1];
      return [1, -1];
    }
    if (p.kind === "alif_madd") {
      const nxt = i + 1 < ph2.length ? ph2[i + 1] : null;
      if (nxt !== null && nxt.hint === "madd_mora") return [0, -1];
      if (i > 0 && ph2[i - 1].hint === "foldable") {
        const prevA = assign.length ? assign[assign.length - 1] : 1;
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
  function extra(p, ch, ph2, i, assign) {
    let e = 0;
    if (p.kind === "cons" && p.fixed === null && ch === 0 && p.hint !== "madd_mora" && p.hint !== "foldable") {
      e += 1;
    }
    if ((p.kind === "waw" || p.kind === "ya") && p.fixed === null && ch === 1) {
      const between = i > 0 && i + 1 < ph2.length && ph2[i - 1].kind === "cons" && (ph2[i + 1].kind === "cons" || ph2[i + 1].kind === "ta_marbuta");
      e += between ? 0.05 : 0.35;
    }
    if (p.kind === "wasl" && ch === 1) e += 0.4;
    if (p.kind === "wasl" && ch === -1) e += 0.15;
    if (p.kind === "ta_marbuta" && ch === 1 && p.hint !== "ta_wasl") e += 0.8;
    if (p.hint === "foldable" && ch === -1) e += 0.25;
    if (p.hint === "tanwin" && ch !== -1) e += 0.7;
    if (p.hint === "allah_ha" && ch === 1 && assign.length) {
      const prev = ph2[i - 1];
      if (prev.hint === "allah_madd" && assign[assign.length - 1] === -1) e += 0.6;
    }
    if (ch === 0 && assign.length) {
      const prev = ph2[i - 1];
      if (prev.hint === "allah_ha" && assign[assign.length - 1] === 1) e += 0.85;
    }
    return e;
  }
  function trans(state, bit) {
    if (bit !== 0 && bit !== 1) return null;
    if (state === 0) return bit === 1 ? 1 : null;
    if (state === 1) return bit === 0 ? 0 : 2;
    if (state === 2) return bit === 0 ? 0 : null;
    return null;
  }
  function bitsToLaNaam(bits) {
    const out = [];
    let i = 0;
    while (i < bits.length) {
      if (bits.startsWith("110", i)) {
        out.push("\u0646\u0639\u0645");
        i += 3;
      } else if (bits.startsWith("10", i)) {
        out.push("\u0644\u0627");
        i += 2;
      } else break;
    }
    return out;
  }
  var MinHeap = class {
    constructor() {
      __publicField(this, "data", []);
    }
    less(a, b) {
      if (a.cost !== b.cost) return a.cost < b.cost;
      return a.seq < b.seq;
    }
    push(n) {
      this.data.push(n);
      this.up(this.data.length - 1);
    }
    pop() {
      if (!this.data.length) return void 0;
      const top = this.data[0];
      const last = this.data.pop();
      if (this.data.length) {
        this.data[0] = last;
        this.down(0);
      }
      return top;
    }
    up(i) {
      while (i > 0) {
        const p = i - 1 >> 1;
        if (!this.less(this.data[i], this.data[p])) break;
        [this.data[i], this.data[p]] = [this.data[p], this.data[i]];
        i = p;
      }
    }
    down(i) {
      const n = this.data.length;
      for (; ; ) {
        let s = i;
        const l = i * 2 + 1;
        const r = l + 1;
        if (l < n && this.less(this.data[l], this.data[s])) s = l;
        if (r < n && this.less(this.data[r], this.data[s])) s = r;
        if (s === i) break;
        [this.data[i], this.data[s]] = [this.data[s], this.data[i]];
        i = s;
      }
    }
  };
  function generate(h) {
    const ph2 = h.phonemes;
    if (!ph2.length) return [];
    const results = [];
    const seen = /* @__PURE__ */ new Set();
    let seq = 0;
    let expansions = 0;
    const heap = new MinHeap();
    heap.push({ cost: 0, seq: 0, i: 0, ti: 0, bits: "", state: 0, assign: [] });
    while (heap.data.length && results.length < MAX_CANDIDATES && expansions < MAX_EXPANSIONS) {
      const node = heap.pop();
      expansions += 1;
      if (node.i === ph2.length) {
        if (node.state === 0 && node.bits.endsWith("0") && !seen.has(node.bits)) {
          if (node.bits.length >= 4 && node.bits.length <= MAX_BITS) {
            seen.add(node.bits);
            results.push({
              bits: node.bits,
              assign: node.assign,
              cost: node.cost,
              laNaam: bitsToLaNaam(node.bits)
            });
          }
        }
        continue;
      }
      const p = ph2[node.i];
      for (const ch of choices(p, ph2, node.i, node.state, node.assign)) {
        if (ch === -1) {
          heap.push({
            cost: node.cost + extra(p, ch, ph2, node.i, node.assign),
            seq: seq++,
            i: node.i + 1,
            ti: node.ti,
            bits: node.bits,
            state: node.state,
            assign: node.assign.concat(-1)
          });
          continue;
        }
        const newState = trans(node.state, ch);
        if (newState === null) continue;
        if (node.bits.length + 1 > MAX_BITS) continue;
        heap.push({
          cost: node.cost + extra(p, ch, ph2, node.i, node.assign),
          seq: seq++,
          i: node.i + 1,
          ti: node.ti,
          bits: node.bits + String(ch),
          state: newState,
          assign: node.assign.concat(ch)
        });
      }
    }
    results.sort((a, b) => a.cost - b.cost || b.bits.length - a.bits.length);
    return results;
  }
  function generateTowards(h, template) {
    const ph2 = h.phonemes;
    if (!ph2.length || !template) return [];
    const results = [];
    const seen = /* @__PURE__ */ new Set();
    let seq = 0;
    let expansions = 0;
    const heap = new MinHeap();
    heap.push({ cost: 0, seq: 0, i: 0, ti: 0, bits: "", state: 0, assign: [] });
    const n = ph2.length;
    const tlen = template.length;
    while (heap.data.length && results.length < 80 && expansions < MAX_EXPANSIONS) {
      const node = heap.pop();
      expansions += 1;
      if (node.i === n) {
        if (node.ti === tlen && node.state === 0 && !seen.has(node.bits)) {
          if (node.bits.endsWith("0")) {
            seen.add(node.bits);
            results.push({
              bits: node.bits,
              assign: node.assign,
              cost: node.cost,
              laNaam: bitsToLaNaam(node.bits)
            });
          }
        }
        continue;
      }
      const p = ph2[node.i];
      const remainPh = n - node.i;
      const remainT = tlen - node.ti;
      for (const ch of choices(p, ph2, node.i, node.state, node.assign)) {
        if (ch === -1) {
          heap.push({
            cost: node.cost + extra(p, ch, ph2, node.i, node.assign),
            seq: seq++,
            i: node.i + 1,
            ti: node.ti,
            bits: node.bits,
            state: node.state,
            assign: node.assign.concat(-1)
          });
          continue;
        }
        if (node.ti >= tlen) continue;
        if (String(ch) !== template[node.ti]) continue;
        const newState = trans(node.state, ch);
        if (newState === null) continue;
        const heur = Math.max(0, remainT - 1 - (remainPh - 1)) * 0.01;
        heap.push({
          cost: node.cost + extra(p, ch, ph2, node.i, node.assign) + heur,
          seq: seq++,
          i: node.i + 1,
          ti: node.ti + 1,
          bits: node.bits + String(ch),
          state: newState,
          assign: node.assign.concat(ch)
        });
      }
    }
    results.sort((a, b) => a.cost - b.cost || b.bits.length - a.bits.length);
    return results;
  }

  // src/lib/arud/tokenize.ts
  var SHAMSI = /* @__PURE__ */ new Set([..."\u062A\u062B\u062F\u0630\u0631\u0632\u0633\u0634\u0635\u0636\u0637\u0638\u0644\u0646"]);
  var ALIF_MADD = /* @__PURE__ */ new Set(["\u0627", "\u0671"]);
  var MADDA_ALIF = "\u0622";
  var WAW = "\u0648";
  var YA = "\u064A";
  var TA_MARBUTA = "\u0629";
  var LAM = "\u0644";
  var SHADDA = "\u0651";
  var SUKUN = "\u0652";
  var FATHA = "\u064E";
  var DAMMA = "\u064F";
  var KASRA = "\u0650";
  var TATWEEL = "\u0640";
  var SUPERSCRIPT_ALIF = "\u0670";
  var FATHATAN = "\u064B";
  var DAMMATAN = "\u064C";
  var KASRATAN = "\u064D";
  var HARAKAT = /* @__PURE__ */ new Set([
    SHADDA,
    SUKUN,
    FATHA,
    DAMMA,
    KASRA,
    FATHATAN,
    DAMMATAN,
    KASRATAN,
    SUPERSCRIPT_ALIF
  ]);
  var VOWEL_MARKS = /* @__PURE__ */ new Set([FATHA, DAMMA, KASRA]);
  var PREFIX_CONNECT = /* @__PURE__ */ new Set([..."\u0648\u0641\u0628\u0643\u0644"]);
  var FUNCTION_10 = /* @__PURE__ */ new Set([
    "\u064A\u0627",
    "\u0645\u0646",
    "\u0639\u0646",
    "\u0641\u064A",
    "\u0644\u0645",
    "\u0647\u0644",
    "\u0628\u0644",
    "\u0642\u062F",
    "\u0625\u0646",
    "\u0623\u0646",
    "\u0627\u0648",
    "\u0623\u0648",
    "\u0645\u0627",
    "\u0644\u0627",
    "\u0644\u0647",
    "\u0628\u0647",
    "\u0643\u0645",
    "\u062B\u0645",
    "\u0645\u0639"
  ]);
  var PRONOUNS = /* @__PURE__ */ new Set(["\u0647\u0648", "\u0647\u064A", "\u0647\u0645", "\u0647\u0646", "\u0647\u0645\u0627"]);
  var ALLAH_FORMS = /* @__PURE__ */ new Set([
    "\u0627\u0644\u0644\u0647",
    "\u0627\u0644\u0644\u0651\u0647",
    "\u0627\u0644\u0644\u064E\u0651\u0647",
    "\u0627\u0644\u0644\u0651\u0670\u0647",
    "\u0644\u0644\u0647",
    "\u0648\u0627\u0644\u0644\u0647",
    "\u0628\u0627\u0644\u0644\u0647",
    "\u062A\u0627\u0644\u0644\u0647",
    "\u0641\u0627\u0644\u0644\u0647"
  ]);
  function isArabicLetter(ch) {
    var _a;
    const o = (_a = ch.codePointAt(0)) != null ? _a : 0;
    return o >= 1569 && o <= 1594 || o >= 1601 && o <= 1610 || "\u0629\u0649\u0622\u0623\u0625\u0624\u0626\u0621\u0671".includes(ch);
  }
  function stripHarakat(text) {
    return [...text].filter((ch) => !HARAKAT.has(ch) && ch !== TATWEEL).join("");
  }
  var KEEP_RE = /[^\u0600-\u06FF\s*]+/g;
  var MULTI_SPACE = /\s+/g;
  var NUMBERING = /^[\d٠-٩]+[.\-)\]]\s*/;
  function splitBayt(text) {
    if (!text || !text.trim()) return [];
    const t = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    let parts;
    if (t.includes("***")) parts = t.split("***").map((p) => p.trim());
    else if (t.includes("\n")) parts = t.split("\n").map((p) => p.trim());
    else if (t.includes(" * ")) parts = t.split(" * ").map((p) => p.trim());
    else if ((t.match(/\*/g) || []).length === 1) parts = t.split("*").map((p) => p.trim());
    else parts = [t.trim()];
    return parts.filter(Boolean);
  }
  function cleanLine(text) {
    let t = text.trim().replaceAll(TATWEEL, "");
    t = t.replace(NUMBERING, "");
    t = t.replace(KEEP_RE, " ").replaceAll("*", " ");
    return t.replace(MULTI_SPACE, " ").trim();
  }
  function iterBaseLetters(word) {
    const out = [];
    let i = 0;
    while (i < word.length) {
      const ch = word[i];
      if (HARAKAT.has(ch) || ch === TATWEEL || ch === " ") {
        i += 1;
        continue;
      }
      if (!isArabicLetter(ch) && !"\u0622\u0623\u0625\u0624\u0626\u0621\u0649\u0629\u0671".includes(ch)) {
        i += 1;
        continue;
      }
      let j = i + 1;
      let hasShadda = false;
      let hasSukun = false;
      let hasVowel = false;
      while (j < word.length && HARAKAT.has(word[j])) {
        if (word[j] === SHADDA) hasShadda = true;
        else if (word[j] === SUKUN) hasSukun = true;
        else if (VOWEL_MARKS.has(word[j])) hasVowel = true;
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
  function isAllahWord(bare) {
    return ALLAH_FORMS.has(bare) || bare.endsWith("\u0627\u0644\u0644\u0647") || bare === "\u0627\u0644\u0644\u0647";
  }
  function ph(char, kind, fixed, display, wordI, hint) {
    return { char, kind, fixed, display, wordI, hint };
  }
  function allahPhonemes(word, wordI, firstWord, lastWord) {
    let bare = stripHarakat(word);
    let prefix = "";
    for (const p of ["\u0648", "\u0628", "\u0641", "\u062A", "\u0644"]) {
      if (bare.startsWith(p + "\u0627\u0644\u0644\u0647") || bare === p + "\u0644\u0647") {
        prefix = p;
        bare = bare.slice(p.length);
        break;
      }
    }
    if (bare === "\u0644\u0647") {
      prefix = prefix || "\u0644";
    }
    const out = [];
    if (prefix) out.push(ph(prefix, "cons", 1, true, wordI, "prefix"));
    if (firstWord && !prefix) {
      out.push(ph("\u0627", "cons", 1, true, wordI, "allah_alif"));
    } else {
      out.push(ph("\u0627", "wasl", null, true, wordI, "allah_alif"));
    }
    out.push(ph("\u0644", "cons", 0, true, wordI, "allah_lam1"));
    out.push(ph("\u0644", "cons", 1, true, wordI, "allah_lam2"));
    if (!lastWord) {
      out.push(ph("\u0627", "alif_madd", 0, false, wordI, "allah_madd"));
      out.push(ph("\u0647", "cons", null, true, wordI, "allah_ha"));
    } else {
      out.push(ph("\u0647", "cons", 0, true, wordI, "allah_ha"));
    }
    return out;
  }
  function function10(word, wordI) {
    let letters = iterBaseLetters(word).map((x) => x.ch);
    if (!letters.length) letters = [...stripHarakat(word)];
    if (letters.length === 1) {
      const ch = letters[0];
      if (ALIF_MADD.has(ch) || ch === "\u0649") return [ph(ch, "alif_madd", 0, true, wordI, "fn")];
      return [ph(ch, "cons", 1, true, wordI, "fn"), ph("", "collapsed", 0, false, wordI, "fn_sukun")];
    }
    const out = [];
    letters.forEach((ch, k) => {
      if (k === 0) {
        let kind = "cons";
        if (ch === WAW) kind = "waw";
        else if (ch === YA || ch === "\u0649") kind = "ya";
        out.push(ph(ch, kind, 1, true, wordI, "fn10"));
      } else if (ALIF_MADD.has(ch) || ch === "\u0649" || ch === MADDA_ALIF) {
        out.push(ph(ch === MADDA_ALIF ? "\u0627" : ch, "alif_madd", 0, true, wordI, "fn10"));
      } else {
        out.push(ph(ch, "cons", 0, true, wordI, "fn10"));
      }
    });
    return out;
  }
  function pronoun(word, wordI, lastWord) {
    let letters = iterBaseLetters(word).map((x) => x.ch);
    if (!letters.length) letters = [...stripHarakat(word)];
    const out = [];
    letters.forEach((ch, k) => {
      const last = lastWord && k === letters.length - 1;
      const fixed = last ? 0 : 1;
      out.push(ph(ch, "cons", fixed, true, wordI, "pron"));
    });
    return out;
  }
  function applyMaddConstraints(h) {
    const phs = h.phonemes;
    for (let i = 0; i < phs.length; i++) {
      const p = phs[i];
      if (p.kind === "alif_madd") {
        let j = i - 1;
        while (j >= 0 && (phs[j].kind === "wasl" || phs[j].kind === "collapsed")) j -= 1;
        if (j >= 0 && phs[j].kind !== "alif_madd") {
          if (phs[j].hint === "foldable") {
          } else if (phs[j].fixed === null) phs[j].fixed = 1;
        }
      }
      if (i > 0 && phs[i - 1].kind === "alif_madd" && p.fixed === 0) {
        if (p.hint === "allah_ha") continue;
        if (phs[i - 1].wordI !== p.wordI) continue;
        if (p.kind === "cons" || p.kind === "ta_marbuta" || p.kind === "collapsed") {
          p.kind = "collapsed";
        }
      }
    }
  }
  function markFoldable(h) {
    const phs = h.phonemes;
    if (!phs.length) return;
    const lastW = phs[phs.length - 1].wordI;
    const hasAl = phs.some(
      (p) => p.wordI === lastW && (p.hint === "qamari_lam" || p.hint === "shamsi_sukun" || p.hint === "al_wasl")
    );
    if (!hasAl) return;
    for (let i = 0; i < phs.length; i++) {
      const p = phs[i];
      if (p.kind !== "alif_madd" || p.wordI !== lastW || i === 0) continue;
      const prev = phs[i - 1];
      if (prev.wordI !== lastW) continue;
      if ((prev.kind === "cons" || prev.kind === "waw" || prev.kind === "ya") && prev.hint !== "qamari_lam" && prev.hint !== "shamsi_sukun" && prev.hint !== "fn10") {
        prev.hint = "foldable";
        prev.fixed = null;
      }
    }
  }
  function insertMaddMorae(h) {
    const out = [];
    const phs = h.phonemes;
    for (let i = 0; i < phs.length; i++) {
      const p = phs[i];
      out.push(p);
      if (p.kind !== "alif_madd" || i + 1 >= phs.length) continue;
      const nxt = phs[i + 1];
      if (nxt.wordI !== p.wordI || nxt.kind === "collapsed") continue;
      if (nxt.kind === "cons" || nxt.kind === "ta_marbuta" || nxt.kind === "waw" || nxt.kind === "ya") {
        out.push(ph("", "cons", null, false, p.wordI, "madd_mora"));
      }
    }
    h.phonemes = out;
  }
  function bindTaBeforeAl(h) {
    const phs = h.phonemes;
    for (let i = 0; i < phs.length; i++) {
      const p = phs[i];
      if (p.kind !== "ta_marbuta" || p.fixed !== null) continue;
      if (i + 1 < phs.length && phs[i + 1].kind === "wasl" && phs[i + 1].hint === "al_wasl") {
        p.hint = "ta_wasl";
      }
    }
  }
  function insertTanwin(h) {
    const phs = h.phonemes;
    if (!phs.length) return;
    const lastW = phs[phs.length - 1].wordI;
    const blocked = /* @__PURE__ */ new Set();
    for (const p of phs) {
      if (p.hint === "al_alif" || p.hint === "al_wasl" || p.hint === "qamari_lam" || p.hint === "shamsi_sukun" || p.hint === "fn10" || p.hint === "fn" || p.hint === "pron" || p.hint.startsWith("allah")) {
        blocked.add(p.wordI);
      }
    }
    const out = [];
    for (let i = 0; i < phs.length; i++) {
      const p = phs[i];
      out.push(p);
      const lastOfWord = i === phs.length - 1 || phs[i + 1].wordI !== p.wordI;
      if (!lastOfWord || p.wordI === lastW || blocked.has(p.wordI)) continue;
      if (p.kind === "wasl" || p.kind === "collapsed" || !p.display) continue;
      out.push(ph("", "cons", null, false, p.wordI, "tanwin"));
    }
    h.phonemes = out;
  }
  function tokenizeHemistich(text) {
    const cleaned = cleanLine(text);
    const words = cleaned.split(" ").filter(Boolean);
    const h = { raw: text, cleaned, words, phonemes: [] };
    if (!words.length) return h;
    for (let wi = 0; wi < words.length; wi++) {
      const word = words[wi];
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
      if (letters.length >= 3 && (ALIF_MADD.has(letters[0].ch) || "\u0623\u0625\u0671\u0622".includes(letters[0].ch)) && letters[1].ch === LAM) {
        const shamsi = SHAMSI.has(letters[2].ch);
        const alifCh = letters[0].ch;
        if (alifCh === MADDA_ALIF) {
          h.phonemes.push(ph("\u0622", "cons", 1, true, wi, "hamza"));
          h.phonemes.push(ph("\u0627", "alif_madd", 0, true, wi, "madda"));
        } else if (first) {
          h.phonemes.push(ph("\u0627", "cons", 1, true, wi, "al_alif"));
        } else {
          h.phonemes.push(ph("\u0627", "wasl", null, true, wi, "al_wasl"));
        }
        if (shamsi) {
          const sham = letters[2].ch;
          h.phonemes.push(ph(sham, "cons", 0, true, wi, "shamsi_sukun"));
          h.phonemes.push(ph(sham, "cons", 1, false, wi, "shamsi_move"));
          idx = 3;
        } else {
          h.phonemes.push(ph("\u0644", "cons", 0, true, wi, "qamari_lam"));
          idx = 2;
        }
      }
      const rest = letters.slice(idx);
      rest.forEach((item, k) => {
        const ch = item.ch;
        const lastOfWord = k === rest.length - 1;
        const lastOfLine = lastOfWord && wi === words.length - 1;
        if (ch === MADDA_ALIF) {
          h.phonemes.push(ph("\u0623", "cons", 1, true, wi, "madda_h"));
          h.phonemes.push(ph("\u0627", "alif_madd", 0, true, wi, "madda_a"));
          return;
        }
        if (ALIF_MADD.has(ch)) {
          h.phonemes.push(ph("\u0627", "alif_madd", 0, true, wi, "madd"));
          return;
        }
        if (ch === "\u0649") {
          h.phonemes.push(ph("\u0649", "alif_madd", 0, true, wi, "maqsur"));
          return;
        }
        if (ch === TA_MARBUTA) {
          h.phonemes.push(ph("\u0629", "ta_marbuta", lastOfLine ? 0 : null, true, wi, "ta"));
          return;
        }
        let kind = "cons";
        if (ch === WAW) kind = "waw";
        else if (ch === YA) kind = "ya";
        let fixed = null;
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
        const p = h.phonemes[i];
        if (p.display || p.kind !== "collapsed") {
          if (p.kind !== "wasl") p.fixed = 0;
          break;
        }
      }
    }
    markFoldable(h);
    applyMaddConstraints(h);
    insertMaddMorae(h);
    bindTaBeforeAl(h);
    insertTanwin(h);
    return h;
  }

  // src/lib/arud/engine.ts
  var ACCEPT = 0.9;
  var SHORT_MIN = 6;
  function emptyResult(text, cleaned, meterId, mode, message, letters = [], bits = "", laNaam = []) {
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
      mode
    };
  }
  function lettersFor(h, cand) {
    const out = [];
    h.phonemes.forEach((p, i) => {
      var _a, _b, _c;
      const a = (_a = cand.assign[i]) != null ? _a : -1;
      if (!p.display && a === -1) return;
      if (p.kind === "alif_madd" && a === -1 && p.display) {
        let moraBit = null;
        if (i + 1 < h.phonemes.length && h.phonemes[i + 1].hint === "madd_mora") {
          moraBit = i + 1 < cand.assign.length ? (_b = cand.assign[i + 1]) != null ? _b : -1 : -1;
        }
        if (moraBit === 1) {
          out.push({
            char: p.char || "\u0627",
            bit: 0,
            skipped: false,
            kind: p.kind,
            wordI: p.wordI,
            locked: true,
            shadda: false
          });
        } else {
          out.push({
            char: p.char || "\u0627",
            bit: null,
            skipped: true,
            kind: p.kind,
            wordI: p.wordI,
            locked: true,
            shadda: false
          });
        }
        return;
      }
      if (!p.display && (a === 0 || a === 1)) return;
      let shadda = false;
      if (i > 0) {
        const prev = h.phonemes[i - 1];
        const prevA = (_c = cand.assign[i - 1]) != null ? _c : -1;
        if (!prev.display && (prev.hint === "user_shadda" || prev.hint === "shamsi_sukun") && prevA === 0 && a === 1) {
          shadda = prev.hint === "user_shadda";
        }
        if (prev.hint === "user_shadda" && prevA === 0) shadda = true;
      }
      out.push({
        char: p.char || "\xB7",
        bit: a === -1 ? null : a,
        skipped: a === -1,
        kind: p.kind,
        wordI: p.wordI,
        locked: p.fixed !== null && p.kind !== "wasl",
        shadda
      });
    });
    return out;
  }
  function boxesOf(hit) {
    let brokenBox = null;
    if (hit.firstDiff !== null) brokenBox = bitToBox(hit.firstDiff, hit.feet);
    const boxes = hit.feet.map((f, i) => {
      var _a;
      return {
        index: i,
        name: f.name,
        laNaam: [...f.laNaam],
        bits: f.bits,
        broken: brokenBox === i && hit.score < ACCEPT,
        zihaf: (_a = f.zihaf) != null ? _a : null
      };
    });
    return { boxes, brokenBox };
  }
  function applyLocks(h, locks) {
    if (!locks) return;
    const shownMap = [];
    for (let i = 0; i < h.phonemes.length; i++) {
      if (h.phonemes[i].display) shownMap.push(i);
    }
    const items = Object.keys(locks).map((k) => [Number(k), Number(locks[Number(k)])]);
    items.sort((a, b) => b[0] - a[0]);
    for (let n = 0; n < items.length; n++) {
      const shown = items[n][0];
      const bit = items[n][1];
      if (shown < 0 || shown >= shownMap.length) continue;
      const pi = shownMap[shown];
      const p = h.phonemes[pi];
      if (bit === 2) {
        const hidden = {
          char: p.char,
          kind: "cons",
          fixed: 0,
          display: false,
          wordI: p.wordI,
          hint: "user_shadda"
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
  function directedCandidates(h, meters, selectedId) {
    const pool = selectedId && selectedId !== "auto" ? meters.filter((m) => m.id === selectedId) : meters;
    const use = pool.length ? pool : meters;
    const out = [];
    const seen = /* @__PURE__ */ new Set();
    for (const meter of use) {
      for (let ti = 0; ti < meter.templates.length; ti++) {
        const tmpl = meter.templates[ti];
        const feet = meter.templateFeet[ti];
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
  function weighHemistich(text, meterId = "auto", locks) {
    var _a;
    const { meters } = loadCatalog();
    const h = tokenizeHemistich(text);
    applyLocks(h, locks);
    const mode = meterId === "" || meterId === "auto" ? "discover" : "check";
    const nDisp = h.phonemes.filter((p) => p.display).length;
    if (!h.phonemes.length || nDisp < 2) {
      return emptyResult(text, h.cleaned, meterId, mode, "\u0637\u0648\u0644 \u063A\u064A\u0631 \u0643\u0627\u0641");
    }
    let cands = directedCandidates(h, meters, mode === "discover" ? null : meterId);
    if (!cands.length) cands = generate(h);
    if (!cands.length) {
      const letters = h.phonemes.filter((p) => p.display).map((p) => ({
        char: p.char || "\xB7",
        bit: p.fixed === 0 || p.fixed === 1 ? p.fixed : null,
        skipped: false,
        kind: p.kind,
        wordI: p.wordI,
        locked: p.fixed !== null
      }));
      return emptyResult(
        text,
        h.cleaned,
        meterId,
        mode,
        nDisp < 6 ? "\u0637\u0648\u0644 \u063A\u064A\u0631 \u0643\u0627\u0641" : "\u0644\u0627 \u062A\u0642\u0637\u064A\u0639 \u064A\u062A\u062C\u0645\u0651\u0639 \u0625\u0644\u0649 \u0623\u0633\u0628\u0627\u0628 \u0648\u0623\u0648\u062A\u0627\u062F (10 \u0648 110). \u0627\u0636\u063A\u0637 \u062D\u0631\u0641\u0627\u064B \u0644\u0642\u0644\u0628 \u0627\u0644\u0633\u0643\u0648\u0646.",
        letters
      );
    }
    if (Math.max(...cands.map((c) => c.bits.length)) < SHORT_MIN) {
      return emptyResult(
        text,
        h.cleaned,
        meterId,
        mode,
        "\u0637\u0648\u0644 \u063A\u064A\u0631 \u0643\u0627\u0641",
        lettersFor(h, cands[0]),
        cands[0].bits,
        cands[0].laNaam
      );
    }
    const selected = mode === "discover" ? null : meterId;
    let bestHit = null;
    let bestCand = null;
    const ranked = [];
    for (const c of cands.slice(0, 400)) {
      const hits = matchCandidate(c.bits, meters, selected);
      if (!hits.length) continue;
      const h0 = hits[0];
      h0.score = h0.score - 2e-3 * c.cost;
      ranked.push({ hit: h0, cand: c });
      if (!bestHit || h0.score > bestHit.score + 1e-12) {
        bestHit = h0;
        bestCand = c;
      } else if (bestHit && Math.abs(h0.score - bestHit.score) < 1e-9) {
        if (c.cost < ((_a = bestCand == null ? void 0 : bestCand.cost) != null ? _a : 1e9)) {
          bestHit = h0;
          bestCand = c;
        }
      }
    }
    if (!bestHit || !bestCand) {
      return emptyResult(text, h.cleaned, meterId, mode, "\u0637\u0648\u0644 \u063A\u064A\u0631 \u0643\u0627\u0641");
    }
    const alts = [];
    const seenBits = /* @__PURE__ */ new Set([bestCand.bits]);
    const sorted = [...ranked].sort((a, b) => b.hit.score - a.hit.score);
    for (const { hit, cand } of sorted) {
      if (seenBits.has(cand.bits)) continue;
      if (hit.score >= bestHit.score - 0.08 && alts.length < 3) {
        let note = "";
        if (cand.bits.startsWith("1010110") || cand.bits === "1010110") note = "\u0647\u062C\u0631 \u0633\u0627\u0643\u0646\u0629 \u2192 \u0645\u0633\u062A\u0641\u0639\u0644\u0646";
        if (cand.bits.endsWith("1011010") || cand.bits === "1011010") note = "\u0647\u062C\u0631 \u0645\u0641\u062A\u0648\u062D\u0629 \u2192 \u0641\u0627\u0639\u0644\u0627\u062A\u0646";
        alts.push({
          bits: cand.bits,
          laNaam: cand.laNaam,
          meterName: hit.meter.name,
          score: Math.round(hit.score * 1e4) / 1e4,
          note
        });
        seenBits.add(cand.bits);
      }
    }
    const { boxes, brokenBox } = boxesOf(bestHit);
    const accepted = bestHit.score >= ACCEPT;
    const message = mode === "check" ? accepted ? "\u0645\u0648\u0632\u0648\u0646" : "\u0645\u0643\u0633\u0648\u0631" : accepted ? "\u0645\u0648\u0632\u0648\u0646" : "\u0623\u0642\u0631\u0628 \u0628\u062D\u0631 \u2014 \u0627\u0644\u0645\u0637\u0627\u0628\u0642\u0629 \u062F\u0648\u0646 \u0627\u0644\u0639\u062A\u0628\u0629";
    return {
      ok: true,
      message,
      text,
      cleaned: h.cleaned,
      meterId: bestHit.meter.id,
      meterName: bestHit.meter.name,
      fasih: bestHit.meter.fasih,
      score: Math.round(Math.min(1, Math.max(0, bestHit.score)) * 1e4) / 1e4,
      accepted,
      bits: bestCand.bits,
      laNaam: bestCand.laNaam,
      letters: lettersFor(h, bestCand),
      boxes,
      firstDiff: bestHit.firstDiff,
      brokenBox: accepted ? null : brokenBox,
      alts,
      mode
    };
  }
  function meterList() {
    var _a, _b, _c;
    const { meters } = loadCatalog();
    const out = [{ id: "auto", name: "\u062A\u0644\u0642\u0627\u0626\u064A", feet: [], bits: "" }];
    for (const m of meters) {
      out.push({
        id: m.id,
        name: m.name,
        fasih: m.fasih,
        feet: (_b = (_a = m.templateFeet[0]) == null ? void 0 : _a.map((f) => f.name)) != null ? _b : [],
        bits: (_c = m.templates[0]) != null ? _c : "",
        note: m.note
      });
    }
    return out;
  }
  function weigh(text, meterId = "auto", locks) {
    const parts = splitBayt(text);
    if (!parts.length) {
      return {
        ok: false,
        message: "\u0623\u062F\u062E\u0644 \u0635\u062F\u0631\u0627\u064B \u0623\u0648 \u0639\u062C\u0632\u0627\u064B \u0623\u0648 \u0628\u064A\u062A\u0627\u064B \u0645\u0641\u0635\u0648\u0644\u0627\u064B \u0628\u0646\u062C\u0645\u0629 \u0623\u0648 \u0633\u0637\u0631.",
        hemistichs: [],
        meters: meterList(),
        mode: meterId === "auto" || !meterId ? "discover" : "check",
        selected: meterId
      };
    }
    const hemistichs = parts.map((p, i) => weighHemistich(p, meterId, locks == null ? void 0 : locks[i]));
    const names = hemistichs.filter((r) => r.ok && r.meterName).map((r) => r.meterName);
    const same = new Set(names).size <= 1;
    let overall = hemistichs.length && hemistichs.every((r) => r.accepted) ? "\u0645\u0648\u0632\u0648\u0646" : "\u0631\u0627\u062C\u0639 \u0627\u0644\u0643\u0633\u0631";
    if (hemistichs.length === 1 && hemistichs[0] && !hemistichs[0].ok && hemistichs[0].message === "\u0637\u0648\u0644 \u063A\u064A\u0631 \u0643\u0627\u0641") {
      overall = "\u0637\u0648\u0644 \u063A\u064A\u0631 \u0643\u0627\u0641";
    }
    return {
      ok: true,
      message: overall,
      sameMeter: same,
      hemistichs,
      meters: meterList(),
      mode: meterId === "auto" || !meterId ? "discover" : "check",
      selected: meterId
    };
  }
  return __toCommonJS(index_exports);
})();
