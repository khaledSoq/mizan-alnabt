"""توليد تقطيعات محتملة بقيود. حد أعلى 3000 مرشح."""

from __future__ import annotations

import heapq
from dataclasses import dataclass, field
from typing import Optional

from .tokenize import Hemistich, Phoneme

MAX_CANDIDATES = 3000
MAX_EXPANSIONS = 12000
MAX_BITS = 32


def _choices(p: Phoneme) -> list[int]:
    """القيم الممكنة لهذا الحرف. wasl: 1 أو حذف (نرمز الحذف بـ -1)."""
    if p.kind == "wasl":
        if p.fixed == 1:
            return [1]
        if p.fixed == 0:
            return [-1]
        return [-1, 1]  # إسقاط الوصل أرجح في النبطي بعد كلمة سابقة
    if p.kind == "collapsed":
        return [-1]  # لا يُحسب بتّاً مستقلاً (مد+سكون = سكون واحد)
    if p.hint == "allah_madd":
        # مد لفظ الجلالة: يُحسب 0 مع هاء متحركة، أو يُسقط إن كانت الهاء ساكنة
        return [-1, 0]
    if p.kind == "alif_madd":
        return [0]
    if p.fixed is not None:
        return [p.fixed]
    # واو وياء وسط الكلمة: مد 0 أو صامت متحرك 1
    if p.kind in ("waw", "ya"):
        return [0, 1]
    # صامت: متحرك أو ساكن (التقاء صامتين)
    return [1, 0]


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
        for ch in _choices(p):
            if ch == -1:
                # حذف (وصل أو هاء بعد مد)
                heapq.heappush(
                    heap,
                    _Node(
                        node.cost + (0.15 if p.kind == "wasl" else 0.0),
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

            extra = 0.0
            if p.kind == "cons" and p.fixed is None and ch == 0:
                extra += 1.0  # سكون اختياري
            if p.kind in ("waw", "ya") and p.fixed is None and ch == 1:
                extra += 0.35  # ياء/واو صامتة أقل كلفة من سكون عشوائي
            if p.kind == "wasl" and ch == 1:
                extra += 0.4  # تحقيق همزة الوصل أثقل من حذفها
            if p.kind == "ta_marbuta" and ch == 1:
                extra += 0.8
            # لفظ الجلالة سببان لا وتد: إسقاط المد مع هاء 1 يجعل اللام+الهاء 11
            if p.hint == "allah_ha" and ch == 1 and node.assign:
                prev = ph[node.i - 1]
                if prev.hint == "allah_madd" and node.assign[-1] == -1:
                    extra += 0.6
            # بعد هاء متحركة فضّل وتد هَمِمْ (110) على سبب هَمْ (10)
            if ch == 0 and node.assign:
                prev = ph[node.i - 1]
                if prev.hint == "allah_ha" and node.assign[-1] == 1:
                    extra += 0.85

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
