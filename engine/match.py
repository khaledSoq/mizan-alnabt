"""مطابقة السلسلة على قوالب البحور ومتغيرات الزحاف المخزونة مسبقاً."""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from functools import lru_cache
from itertools import product
from pathlib import Path
from typing import Optional

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "meters.json"

ZIHAF_ALT = {
    "mustafcilun": ["mustafcilun", "mutafcilun", "muftacilun"],
    "faulun": ["faulun", "faulu"],
    "failun": ["failun", "failun_short"],
    "mafailun": ["mafailun", "mafailu"],
}


@dataclass
class Foot:
    key: str
    bits: str
    name: str
    la_naam: list[str]
    zihaf: Optional[str] = None


@dataclass
class Meter:
    id: str
    name: str
    fasih: str
    priority: int
    foot_keys: list[str]
    note: str
    templates: list[str] = field(default_factory=list)
    template_feet: list[list[Foot]] = field(default_factory=list)


@dataclass
class MeterHit:
    meter: Meter
    template: str
    feet: list[Foot]
    score: float
    hamm: int
    first_diff: Optional[int]
    bits: str


def _load_raw() -> dict:
    with DATA_PATH.open(encoding="utf-8") as f:
        return json.load(f)


@lru_cache(maxsize=1)
def load_catalog() -> tuple[dict[str, Foot], list[Meter]]:
    raw = _load_raw()
    feet: dict[str, Foot] = {}
    for k, v in raw["feet"].items():
        feet[k] = Foot(
            key=k,
            bits=v["bits"],
            name=v["name"],
            la_naam=list(v["la_naam"]),
            zihaf=v.get("zihaf"),
        )
    meters: list[Meter] = []
    for m in raw["meters"]:
        meter = Meter(
            id=m["id"],
            name=m["name"],
            fasih=m.get("fasih", ""),
            priority=int(m.get("priority", 99)),
            foot_keys=list(m["feet"]),
            note=m.get("note", ""),
        )
        alts = []
        for fk in meter.foot_keys:
            alts.append(ZIHAF_ALT.get(fk, [fk]))
        for combo in product(*alts):
            fs = [feet[k] for k in combo]
            bits = "".join(f.bits for f in fs)
            meter.templates.append(bits)
            meter.template_feet.append(fs)
        meters.append(meter)
    meters.sort(key=lambda x: x.priority)
    return feet, meters


def score_bits(seq: str, template: str) -> tuple[float, int, Optional[int]]:
    """درجة التطابق = 1 إن تساوتا، وإلا 1 ناقص مسافة هامنغ على الطول الأطول."""
    if not seq and not template:
        return 0.0, 0, None
    n = max(len(seq), len(template))
    m = min(len(seq), len(template))
    hamm = 0
    first = None
    for i in range(m):
        if seq[i] != template[i]:
            hamm += 1
            if first is None:
                first = i
    hamm += abs(len(seq) - len(template))
    if len(seq) != len(template) and first is None:
        first = m
    return 1.0 - hamm / n, hamm, first


def bit_to_box(index: int, feet: list[Foot]) -> int:
    """رقم البت → صندوق التفعيلة بالترتيب."""
    acc = 0
    for i, f in enumerate(feet):
        acc += len(f.bits)
        if index < acc:
            return i
    return max(0, len(feet) - 1)


def match_candidate(
    bits: str,
    meters: list[Meter],
    selected_id: Optional[str] = None,
) -> list[MeterHit]:
    hits: list[MeterHit] = []
    pool = meters
    if selected_id and selected_id != "auto":
        pool = [m for m in meters if m.id == selected_id] or meters

    for meter in pool:
        best: Optional[MeterHit] = None
        for tmpl, feet in zip(meter.templates, meter.template_feet):
            candidates_tmpl = [tmpl]
            acc = 0
            prefix_feet: list[list[Foot]] = []
            built: list[Foot] = []
            for f in feet:
                built.append(f)
                acc += len(f.bits)
                if acc < len(tmpl):
                    prefix_feet.append(list(built))
                    candidates_tmpl.append(tmpl[:acc])
            all_feet = [feet] + prefix_feet
            for t, fs in zip(candidates_tmpl, all_feet):
                if t != tmpl and abs(len(bits) - len(t)) > 2:
                    continue
                if t != tmpl and len(bits) >= len(tmpl) - 1:
                    continue
                sc, hamm, first = score_bits(bits, t)
                if t != tmpl:
                    sc -= 0.04
                else:
                    if len(bits) == len(t):
                        sc += 0.03
                    elif abs(len(bits) - len(t)) >= 3:
                        sc -= 0.02 * abs(len(bits) - len(t))
                n_zihaf = sum(1 for f in fs if f.zihaf)
                sc -= 0.055 * n_zihaf
                if n_zihaf >= 2:
                    sc -= 0.05
                if fs and fs[0].zihaf:
                    sc -= 0.04
                hit = MeterHit(
                    meter=meter,
                    template=t,
                    feet=fs,
                    score=sc,
                    hamm=hamm,
                    first_diff=first,
                    bits=bits,
                )
                if best is None or sc > best.score + 1e-9:
                    best = hit
                elif best and abs(sc - best.score) < 1e-9 and len(t) > len(best.template):
                    best = hit
                elif best and abs(sc - best.score) < 1e-9 and n_zihaf < sum(
                    1 for f in best.feet if f.zihaf
                ):
                    best = hit
        if best:
            hits.append(best)
    hits.sort(key=lambda h: (-h.score, h.meter.priority, h.hamm))
    return hits
