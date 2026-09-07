"""توليد تقطيعات محتملة بقيود. حد أعلى 3000 مرشح."""

from __future__ import annotations

import heapq
from dataclasses import dataclass, field
from typing import Optional

from .tokenize import Hemistich, Phoneme

MAX_CANDIDATES = 3000
MAX_EXPANSIONS = 12000
MAX_BITS = 32


def _next_real(ph: list[Phoneme], i: int) -> Optional[Phoneme]:
    j = i + 1
    while j < len(ph) and ph[j].kind == "collapsed" and ph[j].hint != "madd_mora":
        j += 1
    return ph[j] if j < len(ph) else None


def _choices(
    p: Phoneme,
    ph: list[Phoneme],
    i: int,
    state: int,
    assign: tuple,
) -> list[int]:
    """القيم الممكنة لهذا الحرف. wasl: 1 أو حذف (نرمز الحذف بـ -1)."""
    if p.kind == "wasl":
        if p.fixed == 1:
            return [1]
        if p.fixed == 0:
            return [-1]
        if i > 0 and ph[i - 1].hint == "ta_wasl":
            return [-1]
        if state == 0:
            nxt = _next_real(ph, i)
            if nxt is not None and nxt.fixed == 0:
                return [1]
        return [-1, 1]
    if p.kind == "collapsed":
        return [-1]
    if p.hint == "allah_madd":
        return [-1, 0]
    if p.hint == "madd_mora":
        prev_a = assign[-1] if assign else 0
        if prev_a == 0:
            return [-1]
        return [1, -1]
    if p.kind == "alif_madd":
        nxt = ph[i + 1] if i + 1 < len(ph) else None
        if nxt is not None and nxt.hint == "madd_mora":
            return [0, -1]
        if i > 0 and ph[i - 1].hint == "foldable":
            prev_a = assign[-1] if assign else 1
            if prev_a == -1:
                return [-1]
            return [0]
        return [0]
    if p.hint == "tanwin":
        return [-1, 0, 1]
    if p.hint == "foldable":
        return [1, -1]
    if p.fixed is not None:
        return [p.fixed]
    if p.kind in ("waw", "ya"):
        return [0, 1]
    return [1, 0]


def _extra(p: Phoneme, ch: int, ph: list[Phoneme], i: int, assign: tuple) -> float:
    extra = 0.0
    if p.kind == "cons" and p.fixed is None and ch == 0 and p.hint not in ("madd_mora", "foldable"):
        extra += 1.0
    if p.kind in ("waw", "ya") and p.fixed is None and ch == 1:
        between = i > 0 and i + 1 < len(ph) and ph[i - 1].kind == "cons" and ph[i + 1].kind in (
            "cons",
            "ta_marbuta",
        )
        extra += 0.05 if between else 0.35
    if p.kind == "wasl" and ch == 1:
        extra += 0.4
    if p.kind == "wasl" and ch == -1:
        extra += 0.15
    if p.kind == "ta_marbuta" and ch == 1 and p.hint != "ta_wasl":
        extra += 0.8
    if p.hint == "foldable" and ch == -1:
        extra += 0.25
    if p.hint == "tanwin" and ch != -1:
        extra += 0.7
    if p.hint == "allah_ha" and ch == 1 and assign:
        prev = ph[i - 1]
        if prev.hint == "allah_madd" and assign[-1] == -1:
            extra += 0.6
    if ch == 0 and assign:
        prev = ph[i - 1]
        if prev.hint == "allah_ha" and assign[-1] == 1:
            extra += 0.85
    return extra


def _trans(state: int, bit: int) -> Optional[int]:
    """آليّة 10 و 110 فقط. الحالة: 0 حد، 1 بعد واحد، 2 بعد 11."""
    if bit not in (0, 1):
        return None
    if state == 0:
        if bit == 1:
            return 1
        return None  # لا يبدأ سبب/وتد بساكن
    if state == 1:
        if bit == 0:
            return 0  # سبب 10
        return 2  # نحو وتد
    if state == 2:
        if bit == 0:
            return 0  # وتد 110
        return None  # 111 مرفوض
    return None


@dataclass(order=True)
class _Node:
    cost: float
    seq: int = field(compare=False)
    i: int = field(compare=False)
    bits: str = field(compare=False)
    state: int = field(compare=False)
    assign: tuple = field(compare=False)  # bit per phoneme, -1 skip


@dataclass
class Candidate:
    bits: str
    assign: tuple  # parallel to phonemes, values 1, 0, or -1
    cost: float
    la_naam: list[str]


def bits_to_la_naam(bits: str) -> list[str]:
    out: list[str] = []
    i = 0
    n = len(bits)
    while i < n:
        if bits.startswith("110", i):
            out.append("نعم")
            i += 3
        elif bits.startswith("10", i):
            out.append("لا")
            i += 2
        else:
            break
    return out


def generate(h: Hemistich) -> list[Candidate]:
    ph = h.phonemes
    if not ph:
        return []

    results: list[Candidate] = []
    seen: set[str] = set()
    seq = 0
    expansions = 0
    heap: list[_Node] = [_Node(0.0, 0, 0, "", 0, tuple())]

    while heap and len(results) < MAX_CANDIDATES and expansions < MAX_EXPANSIONS:
        node = heapq.heappop(heap)
        expansions += 1
        if node.i == len(ph):
            if node.state == 0 and node.bits.endswith("0") and node.bits not in seen:
                if 4 <= len(node.bits) <= MAX_BITS:
                    seen.add(node.bits)
                    results.append(
                        Candidate(
                            bits=node.bits,
                            assign=node.assign,
                            cost=node.cost,
                            la_naam=bits_to_la_naam(node.bits),
                        )
                    )
            continue

        p = ph[node.i]
        for ch in _choices(p, ph, node.i, node.state, node.assign):
            if ch == -1:
                heapq.heappush(
                    heap,
                    _Node(
                        node.cost + _extra(p, ch, ph, node.i, node.assign),
                        seq,
                        node.i + 1,
                        node.bits,
                        node.state,
                        node.assign + (-1,),
                    ),
                )
                seq += 1
                continue

            new_state = _trans(node.state, ch)
            if new_state is None:
                continue
            if len(node.bits) + 1 > MAX_BITS:
                continue

            extra = _extra(p, ch, ph, node.i, node.assign)

            heapq.heappush(
                heap,
                _Node(
                    node.cost + extra,
                    seq,
                    node.i + 1,
                    node.bits + str(ch),
                    new_state,
                    node.assign + (ch,),
                ),
            )
            seq += 1

    results.sort(key=lambda c: (c.cost, -len(c.bits)))
    return results


@dataclass(order=True)
class _TNode:
    cost: float
    seq: int = field(compare=False)
    i: int = field(compare=False)
    ti: int = field(compare=False)
    bits: str = field(compare=False)
    state: int = field(compare=False)
    assign: tuple = field(compare=False)


def generate_towards(h: Hemistich, template: str) -> list[Candidate]:
    """بحث موجّه: لا يُصدَر بتّ إلا إذا طابق القالب. المسار الكامل = تطابق تام."""
    ph = h.phonemes
    if not ph or not template:
        return []
    results: list[Candidate] = []
    seen: set[str] = set()
    seq = 0
    expansions = 0
    heap: list[_TNode] = [_TNode(0.0, 0, 0, 0, "", 0, tuple())]
    n = len(ph)
    tlen = len(template)

    while heap and len(results) < 80 and expansions < MAX_EXPANSIONS:
        node = heapq.heappop(heap)
        expansions += 1
        if node.i == n:
            if node.ti == tlen and node.state == 0 and node.bits not in seen:
                if node.bits.endswith("0"):
                    seen.add(node.bits)
                    results.append(
                        Candidate(
                            bits=node.bits,
                            assign=node.assign,
                            cost=node.cost,
                            la_naam=bits_to_la_naam(node.bits),
                        )
                    )
            continue

        p = ph[node.i]
        remain_ph = n - node.i
        remain_t = tlen - node.ti
        for ch in _choices(p, ph, node.i, node.state, node.assign):
            if ch == -1:
                # بعد اكتمال القالب لا نسمح إلا بالحذف
                heapq.heappush(
                    heap,
                    _TNode(
                        node.cost + _extra(p, ch, ph, node.i, node.assign),
                        seq,
                        node.i + 1,
                        node.ti,
                        node.bits,
                        node.state,
                        node.assign + (-1,),
                    ),
                )
                seq += 1
                continue
            if node.ti >= tlen:
                continue
            if str(ch) != template[node.ti]:
                continue
            new_state = _trans(node.state, ch)
            if new_state is None:
                continue
            extra = _extra(p, ch, ph, node.i, node.assign)
            # تقدير: حروف متبقية مقابل بتات متبقية
            heur = max(0, (remain_t - 1) - (remain_ph - 1)) * 0.01
            heapq.heappush(
                heap,
                _TNode(
                    node.cost + extra + heur,
                    seq,
                    node.i + 1,
                    node.ti + 1,
                    node.bits + str(ch),
                    new_state,
                    node.assign + (ch,),
                ),
            )
            seq += 1

    results.sort(key=lambda c: (c.cost, -len(c.bits)))
    return results
