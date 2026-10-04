"""الروي بعد واو أو ياء (قواعد خالد: الوقفات الثلاث).
طال وصار = لا لأن الروي بعد المد لا يُعدّ. وكذلك بعد الواو والياء المديتين:
سبوق = نعم، مسموح = لا لا، مِين = لا. وغَيْر بالياء الصامتة = نعم، فتبقى القراءة الثانية متاحة."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from engine.engine import weigh_hemistich
from engine.search import generate
from engine.tokenize import tokenize_hemistich


def word_readings(word: str, tie: float = 0.05) -> list[str]:
    """قراءات الكلمة منفردة بعد "يا" (تعريف أرشيف القوافي): الأرجح أولًا ثم المتعادلة."""
    h = tokenize_hemistich(f"يا {word}")
    cands = generate(h)
    out: list[str] = []
    for c in cands:
        if c.cost - cands[0].cost > tie:
            break
        bits = "".join(str(a) for p, a in zip(h.phonemes, c.assign)
                       if p.word_i == 1 and a != -1 and p.kind != "wasl")
        if bits and bits not in out:
            out.append(bits)
    return out


class TestRawiAfterWawYa(unittest.TestCase):
    def test_alif_unchanged(self):
        self.assertEqual(word_readings("طال")[0], "10")
        self.assertEqual(word_readings("صار")[0], "10")

    def test_waw_madd(self):
        self.assertEqual(word_readings("سبوق")[0], "110")
        self.assertEqual(word_readings("مسموح")[0], "1010")

    def test_ya_madd_first(self):
        for w in ("مين", "وين", "عين"):
            self.assertEqual(word_readings(w)[0], "10", w)

    def test_consonantal_ya_still_possible(self):
        self.assertIn("110", word_readings("غير"))

    def test_ta_marbuta_excluded(self):
        self.assertEqual(word_readings("تحية")[0], "1010")

    def test_in_verse_both_readings_available(self):
        # داخل البيت البحر يختار: القراءتان (مدّ والروي لا يُعدّ، أو صامت والروي يُعدّ) متاحتان
        h = tokenize_hemistich("له نحو غايات الكمال سبوق")
        idx = [i for i, p in enumerate(h.phonemes) if p.hint == "fn_wy"]
        self.assertEqual(len(idx), 1)
        i = idx[0]
        pairs = {(c.assign[i - 1], c.assign[i]) for c in generate(h)}
        self.assertIn((0, -1), pairs)
        self.assertIn((1, 0), pairs)

if __name__ == "__main__":
    unittest.main()
