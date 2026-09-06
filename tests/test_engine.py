"""اختبارات إلزامية من تعليمات البناء."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from engine.engine import weigh, weigh_hemistich
from engine.search import bits_to_la_naam
from engine.tokenize import split_bayt, tokenize_hemistich


MASHUB = "يا ما حلا بعد العشا شرب الفنجال"
ARDA = "نحمد الله جت على ما تمنى"
HAJR = "من هجركم"
BAYT = "يا ما حلا بعد العشا شرب الفنجال *** ومن هجركم طال الزمان وما طال"


class SplitTests(unittest.TestCase):
    def test_star_split(self):
        parts = split_bayt("صدر *** عجز")
        self.assertEqual(parts, ["صدر", "عجز"])

    def test_newline_split(self):
        parts = split_bayt("صدر\nعجز")
        self.assertEqual(len(parts), 2)


class MashubTests(unittest.TestCase):
    def test_mashub_selected(self):
        r = weigh_hemistich(MASHUB, "mashub")
        self.assertTrue(r.ok, r.message)
        names = [b.name for b in r.boxes]
        # قريب من مستفعلن مستفعلن فاعلاتن — لا فشل صامت
        self.assertGreaterEqual(len(names), 2, names)
        self.assertIn("مستفعلن", "".join(names) + r.meter_name)
        self.assertGreaterEqual(r.score, 0.75, f"score={r.score} bits={r.bits} boxes={names}")
        self.assertTrue(r.bits, "empty bits")
        self.assertNotIn("11" * 5, r.bits)  # sanity

    def test_letters_align(self):
        r = weigh_hemistich(MASHUB, "mashub")
        shown = [L for L in r.letters if L.char.strip()]
        self.assertGreaterEqual(len(shown), 8)
        bits_from_letters = "".join(str(L.bit) for L in r.letters if L.bit is not None)
        self.assertEqual(bits_from_letters, r.bits)


class ArdaTests(unittest.TestCase):
    def test_auto_arda_not_mashub(self):
        r = weigh_hemistich(ARDA, "auto")
        self.assertTrue(r.ok, r.message)
        self.assertIn(r.meter_id, {"arda", "ramal", "madid", "mumtadd"})
        self.assertNotEqual(r.meter_id, "mashub")
        self.assertGreaterEqual(r.score, 0.80, f"{r.meter_name} {r.score} {r.bits} {r.la_naam}")


class HajrTests(unittest.TestCase):
    def test_two_faces(self):
        r = weigh_hemistich(HAJR, "auto")
        self.assertTrue(r.ok or r.bits, r.message)
        # لا ينهار
        self.assertIsInstance(r.bits, str)

    def test_failatun_meter(self):
        r = weigh_hemistich(HAJR, "arda")
        self.assertNotEqual(r.message, "")
        # جزء من شطر — لا يكسر البرنامج
        self.assertTrue(r.letters)

    def test_hajr_bits_are_one_of_two_faces(self):
        r_arda = weigh_hemistich(HAJR, "arda")
        r_mash = weigh_hemistich(HAJR, "mashub")
        faces = {r_arda.bits, r_mash.bits, weigh_hemistich(HAJR, "auto").bits}
        # أحد الوجهين 1011010 فاعلاتن أو 1010110 مستفعلن
        self.assertTrue(
            any(f in ("1011010", "1010110") or f.startswith("1011010") or f.startswith("1010110") for f in faces),
            faces,
        )


class ShortTests(unittest.TestCase):
    def test_too_short(self):
        r = weigh_hemistich("يا", "auto")
        self.assertEqual(r.message, "طول غير كاف")

    def test_empty(self):
        r = weigh("", "auto")
        self.assertFalse(r["ok"] and r.get("hemistichs"))


class BaytTests(unittest.TestCase):
    def test_sadr_ajuz(self):
        out = weigh("من ساحة الزيت جينا واقفين *** وللولاة الأمر حنا صاملين", "mashub")
        self.assertEqual(len(out["hemistichs"]), 2)
        self.assertTrue(out["hemistichs"][0]["text"])
        self.assertTrue(out["hemistichs"][1]["text"])


class EncodingTests(unittest.TestCase):
    def test_la_naam(self):
        self.assertEqual(bits_to_la_naam("1010110"), ["لا", "لا", "نعم"])
        self.assertEqual(bits_to_la_naam("1011010"), ["لا", "نعم", "لا"])
        self.assertEqual(bits_to_la_naam("10110"), ["لا", "نعم"])

    def test_allah_not_watad(self):
        h = tokenize_hemistich("الله")
        kinds = [p.hint for p in h.phonemes]
        self.assertIn("allah_lam1", kinds)


if __name__ == "__main__":
    unittest.main()
