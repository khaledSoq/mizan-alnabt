"""واجهة المحرك: اكتشاف بحر أو فحص بحر مختار."""

from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any, Optional

from .match import (
    MeterHit,
    bit_to_box,
    load_catalog,
    match_candidate,
)
from .search import Candidate, generate
from .tokenize import Hemistich, Phoneme, split_bayt, tokenize_hemistich

ACCEPT = 0.90
SHORT_MIN = 6


@dataclass
class LetterOut:
    char: str
    bit: Optional[int]  # 1 / 0 / None إن حُذف
    skipped: bool
    kind: str
    word_i: int
    locked: bool
    shadda: bool = False


@dataclass
class BoxOut:
    index: int
    name: str
    la_naam: list[str]
    bits: str
    broken: bool
    zihaf: Optional[str]


@dataclass
class AltOut:
    bits: str
    la_naam: list[str]
    meter_name: str
    score: float
    note: str


@dataclass
class HemistichResult:
    ok: bool
    message: str
    text: str
    cleaned: str
    meter_id: str
    meter_name: str
    fasih: str
    score: float
    accepted: bool
    bits: str
    la_naam: list[str]
    letters: list[LetterOut]
    boxes: list[BoxOut]
    first_diff: Optional[int]
    broken_box: Optional[int]
    alts: list[AltOut]
    mode: str


def _letters_for(h: Hemistich, cand: Candidate) -> list[LetterOut]:
    out: list[LetterOut] = []
    for i, (p, a) in enumerate(zip(h.phonemes, cand.assign)):
        if not p.display and a == -1:
            continue
        if not p.display and a in (0, 1):
            continue
        shadda = False
        if i > 0:
            prev = h.phonemes[i - 1]
            prev_a = cand.assign[i - 1] if i - 1 < len(cand.assign) else -1
            if (not prev.display) and prev.hint in ("user_shadda", "shamsi_sukun") and prev_a == 0 and a == 1:
                shadda = prev.hint == "user_shadda"
            if prev.hint == "user_shadda" and prev_a == 0:
                shadda = True
        out.append(
            LetterOut(
                char=p.char or "·",
                bit=None if a == -1 else int(a),
                skipped=a == -1,
                kind=p.kind,
                word_i=p.word_i,
                locked=p.fixed is not None and p.kind not in ("wasl",),
                shadda=shadda,
            )
        )
    return out


def _boxes(hit: MeterHit) -> tuple[list[BoxOut], Optional[int]]:
    broken_box = None
    if hit.first_diff is not None:
        broken_box = bit_to_box(hit.first_diff, hit.feet)
    boxes: list[BoxOut] = []
    for i, f in enumerate(hit.feet):
        boxes.append(
            BoxOut(
                index=i,
                name=f.name,
                la_naam=list(f.la_naam),
                bits=f.bits,
                broken=broken_box == i and hit.score < ACCEPT,
                zihaf=f.zihaf,
            )
        )
    return boxes, broken_box


def _apply_locks(h: Hemistich, locks: dict[int, int]) -> None:
    """أقفال المستخدم: مفتاحها فهرس الحرف المعروض. 2 = شدة (0 ثم 1)."""
    if not locks:
        return
    shown_map: list[int] = []
    for i, p in enumerate(h.phonemes):
        if p.display:
            shown_map.append(i)
    items = sorted(((int(k), int(v)) for k, v in locks.items()), key=lambda kv: -kv[0])
    for shown, bit in items:
        if shown < 0 or shown >= len(shown_map):
            continue
        pi = shown_map[shown]
        p = h.phonemes[pi]
        if bit == 2:
            hidden = Phoneme(
                char=p.char,
                kind="cons",
                fixed=0,
                display=False,
                word_i=p.word_i,
                src_index=getattr(p, "src_index", 0),
                hint="user_shadda",
            )
            if p.kind in ("waw", "ya", "alif_madd", "wasl", "collapsed"):
                p.kind = "cons"
            p.fixed = 1
            p.hint = "user_shadda_move"
            h.phonemes.insert(pi, hidden)
            continue
        if bit in (0, 1):
            if p.kind == "wasl" and bit == 0:
                p.kind = "collapsed"
                p.fixed = 0
                p.hint = "user_drop"
            elif p.kind == "collapsed":
                if bit == 1:
                    p.kind = "cons"
                    p.fixed = 1
                    p.hint = "user"
            else:
                p.fixed = bit
                p.hint = "user"


def weigh_hemistich(
    text: str,
    meter_id: str = "auto",
    locks: Optional[dict[int, int]] = None,
) -> HemistichResult:
    _, meters = load_catalog()
    h = tokenize_hemistich(text)
    if locks:
        _apply_locks(h, {int(k): int(v) for k, v in locks.items()})

    if not h.phonemes or len([p for p in h.phonemes if p.display]) < 2:
        return HemistichResult(
            ok=False,
            message="طول غير كاف",
            text=text,
            cleaned=h.cleaned,
            meter_id=meter_id,
            meter_name="",
            fasih="",
            score=0.0,
            accepted=False,
            bits="",
            la_naam=[],
            letters=[],
            boxes=[],
            first_diff=None,
            broken_box=None,
            alts=[],
            mode="check" if meter_id not in ("", "auto") else "discover",
        )

    cands = generate(h)
    mode = "discover" if meter_id in ("", "auto") else "check"
    n_disp = len([p for p in h.phonemes if p.display])

    if not cands:
        letters = [
            LetterOut(
                char=p.char or "·",
                bit=p.fixed if p.fixed in (0, 1) else None,
                skipped=False,
                kind=p.kind,
                word_i=p.word_i,
                locked=p.fixed is not None,
            )
            for p in h.phonemes
            if p.display
        ]
        too_short = n_disp < 6
        return HemistichResult(
            ok=False,
            message="طول غير كاف" if too_short else "لا تقطيع يتجمّع إلى أسباب وأوتاد (10 و 110). اضغط حرفاً لقلب السكون.",
            text=text,
            cleaned=h.cleaned,
            meter_id=meter_id,
            meter_name="",
            fasih="",
            score=0.0,
            accepted=False,
            bits="",
            la_naam=[],
            letters=letters,
            boxes=[],
            first_diff=None,
            broken_box=None,
            alts=[],
            mode=mode,
        )

    # أطول سلسلة كافية؟ إن كل المرشحين أقصر من 6 بتات
    if max(len(c.bits) for c in cands) < SHORT_MIN:
        letters = _letters_for(h, cands[0])
        return HemistichResult(
            ok=False,
            message="طول غير كاف",
            text=text,
            cleaned=h.cleaned,
            meter_id=meter_id,
            meter_name="",
            fasih="",
            score=0.0,
            accepted=False,
            bits=cands[0].bits,
            la_naam=cands[0].la_naam,
            letters=letters,
            boxes=[],
            first_diff=None,
            broken_box=None,
            alts=[],
            mode=mode,
        )

    selected = None if mode == "discover" else meter_id

    best_hit: Optional[MeterHit] = None
    best_cand: Optional[Candidate] = None
    # نقيّم كل مرشح. نكتفي بأول ~400 الأرخص لأن الترتيب بالكلفة العروضية
    pool = cands[:400]
    ranked: list[tuple[MeterHit, Candidate]] = []
    for c in pool:
        hits = match_candidate(c.bits, meters, selected)
        if not hits:
            continue
        # في الاكتشاف: أفضل بحر لهذا التقطيع
        # في الفحص: البحر المختار فقط (hits مفلترة)
        h0 = hits[0]
        # كلفة التقطيع تُكسَر بها التعادلات لصالح النطق الأقرب
        h0.score = h0.score - 0.002 * c.cost
        ranked.append((h0, c))
        if best_hit is None or h0.score > best_hit.score + 1e-12:
            best_hit, best_cand = h0, c
        elif best_hit and abs(h0.score - best_hit.score) < 1e-9:
            if c.cost < (best_cand.cost if best_cand else 1e9):
                best_hit, best_cand = h0, c

    if best_hit is None or best_cand is None:
        return HemistichResult(
            ok=False,
            message="طول غير كاف",
            text=text,
            cleaned=h.cleaned,
            meter_id=meter_id,
            meter_name="",
            fasih="",
            score=0.0,
            accepted=False,
            bits="",
            la_naam=[],
            letters=[],
            boxes=[],
            first_diff=None,
            broken_box=None,
            alts=[],
            mode=mode,
        )

    # وجهان قريبان (مثل من هجركم)
    alts: list[AltOut] = []
    seen_bits = {best_cand.bits}
    for hit, c in sorted(ranked, key=lambda x: -x[0].score):
        if c.bits in seen_bits:
            continue
        if hit.score >= best_hit.score - 0.08 and len(alts) < 3:
            note = ""
            if "1010110" in c.bits[:7] or c.bits == "1010110":
                note = "هجر ساكنة → مستفعلن"
            if c.bits.endswith("1011010") or c.bits == "1011010":
                note = "هجر مفتوحة → فاعلاتن"
            alts.append(
                AltOut(
                    bits=c.bits,
                    la_naam=c.la_naam,
                    meter_name=hit.meter.name,
                    score=round(hit.score, 4),
                    note=note,
                )
            )
            seen_bits.add(c.bits)

    boxes, broken_box = _boxes(best_hit)
    accepted = best_hit.score >= ACCEPT
    if mode == "check":
        msg = "موزون" if accepted else "مكسور"
    else:
        msg = "موزون" if accepted else "أقرب بحر — المطابقة دون العتبة"

    return HemistichResult(
        ok=True,
        message=msg,
        text=text,
        cleaned=h.cleaned,
        meter_id=best_hit.meter.id,
        meter_name=best_hit.meter.name,
        fasih=best_hit.meter.fasih,
        score=round(min(1.0, max(0.0, best_hit.score)), 4),
        accepted=accepted,
        bits=best_cand.bits,
        la_naam=best_cand.la_naam,
        letters=_letters_for(h, best_cand),
        boxes=boxes,
        first_diff=best_hit.first_diff,
        broken_box=broken_box if not accepted else None,
        alts=alts,
        mode=mode,
    )


def weigh_text(
    text: str,
    meter_id: str = "auto",
    locks: Optional[list[dict[int, int]]] = None,
) -> dict[str, Any]:
    parts = split_bayt(text)
    if not parts:
        return {
            "ok": False,
            "message": "أدخل صدراً أو عجزاً أو بيتاً مفصولاً بنجمة أو سطر.",
            "hemistichs": [],
            "meters": _meter_list(),
        }
    results: list[HemistichResult] = []
    for i, p in enumerate(parts):
        lk = None
        if locks and i < len(locks):
            lk = locks[i]
        results.append(weigh_hemistich(p, meter_id, lk))

    names = [r.meter_name for r in results if r.ok and r.meter_name]
    same = len(set(names)) <= 1
    overall = "موزون" if all(r.accepted for r in results) and results else "راجع الكسر"
    if any(not r.ok and r.message == "طول غير كاف" for r in results) and len(results) == 1:
        overall = "طول غير كاف"

    return {
        "ok": True,
        "message": overall,
        "same_meter": same,
        "hemistichs": [_result_dict(r) for r in results],
        "meters": _meter_list(),
        "mode": "discover" if meter_id in ("", "auto") else "check",
        "selected": meter_id,
    }


def weigh(text: str, meter_id: str = "auto", locks: Optional[list] = None) -> dict[str, Any]:
    return weigh_text(text, meter_id, locks)


def _result_dict(r: HemistichResult) -> dict[str, Any]:
    return {
        "ok": r.ok,
        "message": r.message,
        "text": r.text,
        "cleaned": r.cleaned,
        "meter_id": r.meter_id,
        "meter_name": r.meter_name,
        "fasih": r.fasih,
        "score": r.score,
        "accepted": r.accepted,
        "bits": r.bits,
        "la_naam": r.la_naam,
        "letters": [asdict(x) for x in r.letters],
        "boxes": [asdict(x) for x in r.boxes],
        "first_diff": r.first_diff,
        "broken_box": r.broken_box,
        "alts": [asdict(x) for x in r.alts],
        "mode": r.mode,
    }


def _meter_list() -> list[dict[str, Any]]:
    _, meters = load_catalog()
    out = [{"id": "auto", "name": "تلقائي", "feet": [], "bits": ""}]
    for m in meters:
        bits = m.templates[0] if m.templates else ""
        names = []
        if m.template_feet:
            names = [f.name for f in m.template_feet[0]]
        out.append(
            {
                "id": m.id,
                "name": m.name,
                "fasih": m.fasih,
                "feet": names,
                "bits": bits,
                "note": m.note,
            }
        )
    return out
