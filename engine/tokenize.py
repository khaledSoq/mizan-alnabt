"""تنظيف الشطر وبناء قائمة الصوامت مع نوع كل حرف."""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Literal, Optional

from .letters import (
    ALIF_MADD,
    ALLAH_FORMS,
    FUNCTION_10,
    HARAKAT,
    LAM,
    MADDA_ALIF,
    PREFIX_CONNECT,
    PRONOUNS,
    SHADDA,
    SHAMSI,
    SUKUN,
    TATWEEL,
    TA_MARBUTA,
    VOWEL_MARKS,
    WAW,
    YA,
    is_arabic_letter,
    strip_harakat,
)

Kind = Literal[
    "cons",
    "alif_madd",
    "waw",
    "ya",
    "wasl",
    "ta_marbuta",
    "collapsed",
]


@dataclass
class Phoneme:
    """وحدة تقطيع واحدة = حرف منطوق يحتمل 1 أو 0."""

    char: str
    kind: Kind
    fixed: Optional[int]  # 0 / 1 / None
    display: bool
    word_i: int
    src_index: int  # موقع في النص المنظّف
    hint: str = ""
    lockable: bool = True


@dataclass
class Hemistich:
    raw: str
    cleaned: str
    words: list[str]
    phonemes: list[Phoneme] = field(default_factory=list)


_KEEP_RE = re.compile(r"[^\u0600-\u06FF\s\*]+")
_MULTI_SPACE = re.compile(r"\s+")
_NUMBERING = re.compile(r"^[\d٠-٩]+[.\-)\]]\s*")


def split_bayt(text: str) -> list[str]:
    """قسم البيت إلى صدر وعجز إذا وجد *** أو * أو سطر جديد."""
    if not text or not text.strip():
        return []
    t = text.replace("\r\n", "\n").replace("\r", "\n")
    if "***" in t:
        parts = [p.strip() for p in t.split("***")]
    elif "\n" in t:
        parts = [p.strip() for p in t.split("\n")]
    elif " * " in t:
        parts = [p.strip() for p in t.split(" * ")]
    elif t.count("*") == 1:
        parts = [p.strip() for p in t.split("*")]
    else:
        parts = [t.strip()]
    return [p for p in parts if p]


def clean_line(text: str) -> str:
    t = text.strip()
    t = t.replace(TATWEEL, "")
    t = _NUMBERING.sub("", t)
    t = _KEEP_RE.sub(" ", t)
    t = t.replace("*", " ")
    t = _MULTI_SPACE.sub(" ", t).strip()
    return t


def _iter_base_letters(word: str):
    """أخرج (حرف، شدة؟، سكون مكتوب؟، حركة مكتوبة؟) مع فك الشدة فوراً."""
    i = 0
    n = len(word)
    while i < n:
        ch = word[i]
        if ch in HARAKAT or ch == TATWEEL or ch == " ":
            i += 1
            continue
        if not is_arabic_letter(ch) and ch not in "آأإؤئءىةٱ":
            i += 1
            continue
        j = i + 1
        has_shadda = False
        has_sukun = False
        has_vowel = False
        while j < n and word[j] in HARAKAT:
            if word[j] == SHADDA:
                has_shadda = True
            elif word[j] == SUKUN:
                has_sukun = True
            elif word[j] in VOWEL_MARKS:
                has_vowel = True
            j += 1
        if has_shadda:
            # الحرف المشدد: ساكن ثم متحرك
            yield ch, False, True, False
            yield ch, False, False, True
        else:
            yield ch, False, has_sukun, has_vowel
        i = j


def _is_allah_word(bare: str) -> bool:
    return bare in ALLAH_FORMS or bare.endswith("الله") or bare == "الله"


def _allah_phonemes(word: str, word_i: int, first_word: bool, src0: int) -> list[Phoneme]:
    """
    كلمة الله ≈ ألالاه: 10 ثم 10. ليست وتداً وحده.
    بالوصل تُحذف ألف الله فيُلصق اللام السابق.
    """
    bare = strip_harakat(word)
    prefix = ""
    core = bare
    for p in ("و", "ب", "ف", "ت", "ل"):
        if bare.startswith(p) and bare[len(p) :] in ("له", "الله") or (
            bare.startswith(p) and "الله" in bare[len(p) :]
        ):
            if bare.startswith(p + "الله") or bare == p + "له":
                prefix = p
                core = bare[len(p) :]
                break
    if core == "له":
        # لله
        prefix = prefix or "ل"
        core = "الله"

    out: list[Phoneme] = []
    if prefix:
        out.append(
            Phoneme(
                char=prefix,
                kind="cons",
                fixed=1,
                display=True,
                word_i=word_i,
                src_index=src0,
                hint="prefix",
            )
        )

    # أ ل ل ا ه
    alif_fixed: Optional[int]
    if first_word and not prefix:
        alif_fixed = 1
        alif_kind: Kind = "cons"
    else:
        # همزة وصل محتملة
        alif_fixed = None
        alif_kind = "wasl"

    out.append(
        Phoneme(
            char="ا",
            kind=alif_kind,
            fixed=alif_fixed if alif_kind != "wasl" else None,
            display=True,
            word_i=word_i,
            src_index=src0,
            hint="allah_alif",
        )
    )
    out.append(
        Phoneme(
            char="ل",
            kind="cons",
            fixed=0,
            display=True,
            word_i=word_i,
            src_index=src0,
            hint="allah_lam1",
        )
    )
    out.append(
        Phoneme(
            char="ل",
            kind="cons",
            fixed=1,
            display=True,
            word_i=word_i,
            src_index=src0,
            hint="allah_lam2",
        )
    )
    out.append(
        Phoneme(
            char="ا",
            kind="alif_madd",
            fixed=0,
            display=True,
            word_i=word_i,
            src_index=src0,
            hint="allah_madd",
        )
    )
    out.append(
        Phoneme(
            char="ه",
            kind="collapsed",
            fixed=0,
            display=True,
            word_i=word_i,
            src_index=src0,
            hint="allah_ha",
        )
    )
    return out


def _function_10(word: str, word_i: int, src0: int) -> list[Phoneme]:
    letters = [ch for ch, *_ in _iter_base_letters(word)]
    if not letters:
        letters = list(strip_harakat(word))
    if len(letters) == 1:
        # لا / ما as V + madd already 2 in يا; single like و handled elsewhere
        ch = letters[0]
        if ch in ALIF_MADD or ch == "ى":
            return [
                Phoneme(ch, "alif_madd", 0, True, word_i, src0, "fn"),
            ]
        return [
            Phoneme(ch, "cons", 1, True, word_i, src0, "fn"),
            Phoneme("", "collapsed", 0, False, word_i, src0, "fn_sukun"),
        ]
    out: list[Phoneme] = []
    # أول متحرك، الباقي ساكن (يا، من، في، لا، ما، قد، هل، بل، لم، إن، أن، أو، عن)
    for k, ch in enumerate(letters):
        if k == 0:
            kind: Kind = "cons"
            if ch in (WAW,):
                kind = "waw"
            elif ch in (YA, "ى"):
                kind = "ya"
            out.append(Phoneme(ch, kind, 1, True, word_i, src0, "fn10"))
        elif ch in ALIF_MADD or ch == "ى" or ch == MADDA_ALIF:
            out.append(Phoneme("ا" if ch == MADDA_ALIF else ch, "alif_madd", 0, True, word_i, src0, "fn10"))
        else:
            out.append(Phoneme(ch, "cons", 0, True, word_i, src0, "fn10"))
    return out


def _pronoun(word: str, word_i: int, src0: int, last_word: bool) -> list[Phoneme]:
    """هو/هي/هم: الواو والياء صامتان لا مدّ. الأول متحرك."""
    letters = [ch for ch, *_ in _iter_base_letters(word)]
    if not letters:
        letters = list(strip_harakat(word))
    out: list[Phoneme] = []
    for k, ch in enumerate(letters):
        last = last_word and k == len(letters) - 1
        fixed: Optional[int] = 0 if last else 1
        out.append(
            Phoneme(
                char=ch,
                kind="cons",
                fixed=fixed,
                display=True,
                word_i=word_i,
                src_index=src0,
                hint="pron",
            )
        )
    return out


def tokenize_hemistich(text: str) -> Hemistich:
    cleaned = clean_line(text)
    words = [w for w in cleaned.split(" ") if w]
    h = Hemistich(raw=text, cleaned=cleaned, words=words)
    if not words:
        return h

    src = 0
    for wi, word in enumerate(words):
        bare = strip_harakat(word)
        first = wi == 0

        if _is_allah_word(bare):
            h.phonemes.extend(_allah_phonemes(word, wi, first, src))
            src += len(word) + 1
            continue

        if bare in FUNCTION_10:
            h.phonemes.extend(_function_10(word, wi, src))
            src += len(word) + 1
            continue

        if bare in PRONOUNS:
            h.phonemes.extend(_pronoun(word, wi, src, last_word=(wi == len(words) - 1)))
            src += len(word) + 1
            continue

        # ال التعريف
        letters = list(_iter_base_letters(word))
        idx = 0
        if (
            len(letters) >= 3
            and letters[0][0] in ALIF_MADD | set("أإٱآ")
            and letters[1][0] == LAM
        ):
            shamsi = letters[2][0] in SHAMSI
            # ألف ال: وصل إن لم تكن أول كلمة
            alif_ch = letters[0][0]
            if alif_ch == MADDA_ALIF:
                h.phonemes.append(Phoneme("آ", "cons", 1, True, wi, src, "hamza"))
                h.phonemes.append(Phoneme("ا", "alif_madd", 0, True, wi, src, "madda"))
            elif first:
                h.phonemes.append(
                    Phoneme("ا", "cons", 1, True, wi, src, "al_alif")
                )
            else:
                h.phonemes.append(
                    Phoneme("ا", "wasl", None, True, wi, src, "al_wasl")
                )
            if shamsi:
                # اللام تُدغم: لا تُحسب مستقلة. شدة الحرف الشمسي 0 ثم 1
                # letters[2] already may have shadda unfolded; force 0 then 1
                sham = letters[2][0]
                h.phonemes.append(
                    Phoneme(sham, "cons", 0, True, wi, src, "shamsi_sukun")
                )
                h.phonemes.append(
                    Phoneme(sham, "cons", 1, False, wi, src, "shamsi_move")
                )
                idx = 3
            else:
                h.phonemes.append(
                    Phoneme("ل", "cons", 0, True, wi, src, "qamari_lam")
                )
                idx = 2

        rest = letters[idx:]
        for k, (ch, _sh, has_sukun, has_vowel) in enumerate(rest):
            last_of_word = k == len(rest) - 1
            last_of_line = last_of_word and wi == len(words) - 1

            if ch == MADDA_ALIF:
                h.phonemes.append(Phoneme("أ", "cons", 1, True, wi, src, "madda_h"))
                h.phonemes.append(Phoneme("ا", "alif_madd", 0, True, wi, src, "madda_a"))
                continue
            if ch in ALIF_MADD:
                h.phonemes.append(Phoneme("ا", "alif_madd", 0, True, wi, src, "madd"))
                continue
            if ch == "ى":
                h.phonemes.append(Phoneme("ى", "alif_madd", 0, True, wi, src, "maqsur"))
                continue
            if ch == TA_MARBUTA:
                # ة في الوقف هاء ساكنة
                h.phonemes.append(
                    Phoneme("ة", "ta_marbuta", 0 if last_of_line else None, True, wi, src, "ta")
                )
                continue

            kind: Kind = "cons"
            if ch == WAW:
                kind = "waw"
            elif ch == YA:
                kind = "ya"

            fixed: Optional[int] = None
            if has_sukun:
                fixed = 0
            elif has_vowel:
                fixed = 1
            if last_of_line:
                fixed = 0

            # واو/ياء وسط الكلمة محتملتان مداً إن لم تُقيَّدا بحركة مكتوبة
            if kind in ("waw", "ya") and not last_of_line and not first and k > 0:
                if has_vowel:
                    fixed = 1
                elif has_sukun:
                    fixed = 0
                else:
                    fixed = None

            # حرف صغير في أول الكلمة: متحرك يُوصل
            if k == 0 and idx == 0 and len(rest) == 1 and ch in PREFIX_CONNECT and not last_of_line:
                fixed = 1

            h.phonemes.append(
                Phoneme(ch, kind, fixed, True, wi, src, kind)
            )

        src += len(word) + 1

    # آخر حرف في الشطر ساكن — قيد ثابت
    if h.phonemes:
        last_disp = None
        for p in reversed(h.phonemes):
            if p.display or p.kind != "collapsed":
                last_disp = p
                break
        if last_disp is not None and last_disp.kind != "wasl":
            last_disp.fixed = 0

    _apply_madd_constraints(h)
    return h


def _apply_madd_constraints(h: Hemistich) -> None:
    """الألف بعد صامت = مد 0، والحرف قبل المد متحرك. المد+سكون يُطوي بتّاً واحداً."""
    ph = h.phonemes
    for i, p in enumerate(ph):
        if p.kind == "alif_madd":
            j = i - 1
            while j >= 0 and ph[j].kind in ("wasl", "collapsed"):
                j -= 1
            if j >= 0 and ph[j].kind not in ("alif_madd",):
                if ph[j].fixed is None:
                    ph[j].fixed = 1
                elif ph[j].fixed == 0 and ph[j].hint not in ("fn10", "qamari_lam", "allah_lam1"):
                    # تعارض نادر: نترك البحث يفشل هذا الفرع
                    pass
        # سكون بعد ألف مد (جال، لاه، تمنى) لا يضيف بتّاً
        if i > 0 and ph[i - 1].kind == "alif_madd" and p.fixed == 0:
            if p.kind in ("cons", "ta_marbuta", "collapsed"):
                p.kind = "collapsed"
