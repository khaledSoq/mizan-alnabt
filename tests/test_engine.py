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
        self.assertGreaterEqual(len(names), 2, names)
        self.assertIn("مستفعلن", "".join(names) + r.meter_name)
        self.assertGreaterEqual(r.score, 0.75, f"score={r.score} bits={r.bits} boxes={names}")
        self.assertTrue(r.bits, "empty bits")
        self.assertNotIn("11" * 5, r.bits)

    def test_letters_align(self):
        r = weigh_hemistich(MASHUB, "mashub")
        shown = [L for L in r.letters if L.char.strip()]
        self.assertGreaterEqual(len(shown), 8)
        bits_from_letters = "".join(str(L.bit) for L in r.letters if L.bit is not None)
        self.assertEqual(bits_from_letters, r.bits)

    def test_mashub_second_gold(self):
        r = weigh_hemistich("ما يستريح القلب لا صار مشغول", "mashub")
        self.assertGreaterEqual(r.score, 0.80, f"{r.score} {r.bits}")


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
        self.assertIsInstance(r.bits, str)

    def test_failatun_meter(self):
        r = weigh_hemistich(HAJR, "arda")
        self.assertNotEqual(r.message, "")
        self.assertTrue(r.letters)

    def test_hajr_bits_are_one_of_two_faces(self):
        r_arda = weigh_hemistich(HAJR, "arda")
        r_mash = weigh_hemistich(HAJR, "mashub")
        faces = {r_arda.bits, r_mash.bits, weigh_hemistich(HAJR, "auto").bits}
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


class MeterGoldTests(unittest.TestCase):
    def test_sakhri_line(self):
        r = weigh_hemistich("أقول لها وقد طارت شعاعا", "sakhri")
        self.assertTrue(r.ok, r.message)
        self.assertGreaterEqual(r.score, 0.85, f"{r.score} {r.bits} {[b.name for b in r.boxes]}")

    def test_hilali_gold(self):
        r = weigh_hemistich("على ما يفوت القلب لا تشمت العدا", "hilali")
        self.assertTrue(r.ok, r.message)
        self.assertGreaterEqual(r.score, 0.90, f"{r.score} {r.bits}")
        auto = weigh_hemistich("على ما يفوت القلب لا تشمت العدا", "auto")
        self.assertEqual(auto.meter_id, "hilali")

    def test_huwa_starts_watad(self):
        r = weigh_hemistich("هو الدهر يا حماد ليس له مدى", "hilali")
        self.assertTrue(r.bits.startswith("11") or r.bits.startswith("10"), r.bits)
        h = tokenize_hemistich("هو الدهر")
        kinds = [(p.char, p.kind, p.fixed, p.hint) for p in h.phonemes]
        self.assertEqual(kinds[0][2], 1)
        self.assertEqual(kinds[0][3], "pron")

    def test_shadda_lock_on_hammad(self):
        text = "هو الدهر يا حماد ليس له مدى"
        base = weigh_hemistich(text, "hilali")
        locked = weigh_hemistich(text, "hilali", {9: 2})
        self.assertTrue(locked.bits)
        self.assertTrue(any(L.shadda for L in locked.letters) or locked.score >= base.score - 0.05)

    def test_hida_gold(self):
        r = weigh_hemistich("يا راكبن من عندنا فوق حرباب", "hida")
        self.assertGreaterEqual(r.score, 0.95, f"{r.score} {r.bits}")

    def test_hajini_tamm_gold(self):
        r = weigh_hemistich("من يلوم القلب ما هو منصف", "hajini_tamm")
        self.assertGreaterEqual(r.score, 0.85, f"{r.score} {r.bits} {r.meter_id}")


    def test_user_bayt_splits(self):
        out = weigh("هو الدهر يا حماد ليس له مدى\nفكم قص من قرم على غرة يدى", "hilali")
        self.assertEqual(len(out["hemistichs"]), 2)


if __name__ == "__main__":
    unittest.main()
