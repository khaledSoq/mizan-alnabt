"""تصنيف الحروف العربية لأغراض التقطيع النبطي."""

from __future__ import annotations

SHAMSI = set("تثدذرزسشصضطظلن")
QAMARI = set("ابجحخعغفقكمهويءأإآؤئ")

CONSONANTS = set("ءبتثجحخدذرزسشصضطظعغفقكلمنهويأإؤئ")

ALIF_MADD = set("اٱ")
ALIF_MAQSURA = "ى"
HAMZA_ALIF = set("أإ")
MADDA_ALIF = "آ"
WAW = "و"
YA = "ي"
TA_MARBUTA = "ة"
LAM = "ل"

SHADDA = "\u0651"
SUKUN = "\u0652"
FATHA = "\u064e"
DAMMA = "\u064f"
KASRA = "\u0650"
FATHATAN = "\u064b"
DAMMATAN = "\u064c"
KASRATAN = "\u064d"
TATWEEL = "\u0640"
SUPERSCRIPT_ALIF = "\u0670"

HARAKAT = {
    SHADDA,
    SUKUN,
    FATHA,
    DAMMA,
    KASRA,
    FATHATAN,
    DAMMATAN,
    KASRATAN,
    SUPERSCRIPT_ALIF,
}

VOWEL_MARKS = {FATHA, DAMMA, KASRA}
TANWIN_MARKS = {FATHATAN, DAMMATAN, KASRATAN}

# كلمات مستقلة تُعامل كسبب خفيف 10
FUNCTION_10 = {
    "يا",
    "من",
    "عن",
    "في",
    "لم",
    "هل",
    "بل",
    "قد",
    "إن",
    "أن",
    "او",
    "أو",
    "ما",
    "لا",
    "له",
    "به",
    "كم",
    "ثم",
}

# ضمائر: الواو/الياء صامت لا مد. هو = هُوَ غالباً 11 ثم سكون بعدها → وتد 110
PRONOUNS = {"هو", "هي", "هم", "هن", "هما"}

PREFIX_CONNECT = set("وفبكل")

ALLAH_FORMS = {"الله", "اللّه", "اللَّه", "اللّٰه", "لله", "والله", "بالله", "تالله", "فالله"}


def is_arabic_letter(ch: str) -> bool:
    o = ord(ch)
    return (
        0x0621 <= o <= 0x063A
        or 0x0641 <= o <= 0x064A
        or ch in "ةىآأإؤئءٱ"
    )


def strip_harakat(text: str) -> str:
    return "".join(ch for ch in text if ch not in HARAKAT and ch != TATWEEL)


def normalize_letter(ch: str) -> str:
    if ch in "أإٱ":
        return "ا" if ch == "ٱ" else ch
    return ch
