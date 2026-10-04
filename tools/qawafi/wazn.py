#!/usr/bin/env python3
"""wazn.py: يضيف عمود الوزن النبطي لكل قافية باستعمال محرك ميزان النبط.

التعريف المعتمد:
  - تُوزن الكلمة بعد "يا" لمحاكاة الوصل، لأن القافية مسبوقة دائمًا بكلمة.
  - يُحذف بِت ألف الوصل إن وُجد، لأنه حركة الكلمة السابقة لا الكلمة نفسها.
  - تُستعمل أكثر صيغة أصلية وردت (فيها الهمزة والتاء المربوطة والألف المقصورة)،
    لا الصيغة الموحّدة، لأن التوحيد يغيّر النطق (الأمين ليست الامين).
  - wazn: التقطيع الأرجح، wazn_alts: تقطيعات بديلة إن وُجدت (الكلمة محتملة).

الاستعمال:
  python wazn.py --mizan ../mizan-alnabt --rhymes out/rhymes.csv
  (يضيف العمودين ويكتب الملف في مكانه؛ ويطبع إحصاءات)
"""
import argparse, collections, csv, os, re, sys, time

DIAC = re.compile(r"[\u0610-\u061A\u064B-\u065F\u0670\u0640]")


def load_engine(mizan_path):
    sys.path.insert(0, os.path.abspath(mizan_path))
    from engine.tokenize import tokenize_hemistich
    from engine.search import generate
    return tokenize_hemistich, generate


TIE = 0.05  # بديل يُعرض فقط إن كانت كلفته قريبة جدًا من الأرجح (تعادل حقيقي)


def scan(word, tokenize, generate, prefix="يا", n_alts=3):
    """يرجع (الأرجح، [البدائل المتعادلة]) كسلاسل 1/0، أو (None, []) إن تعذّر.
    في عزلة عن البحر يتعادل المحرك أحيانًا بين نطقين؛ البدائل هي هذه الحالات فقط."""
    h = tokenize(f"{prefix} {word}")
    cands = generate(h)
    if not cands:
        return None, []
    out = []
    for c in cands[: 1 + 2 * n_alts]:
        if c.cost - cands[0].cost > TIE:
            break
        bits = "".join(
            str(a) for p, a in zip(h.phonemes, c.assign)
            if p.word_i == 1 and a != -1 and str(p.kind).split(".")[-1].lower() != "wasl"
        )
        if bits and bits not in out:
            out.append(bits)
    return (out[0], out[1: 1 + n_alts]) if out else (None, [])


DIAC_MARKS = re.compile(r"[\u064B-\u0652]")


def scan_variants(forms, tokenize, generate):
    """الخطة (أ) بعد القياس: التشكيل يحسم التعادل فقط، ولا ينقض قراءة نجدية واثقة.
    السبب: تشكيل المدونة فصيح (وَشُحُوبي)، والميزان نجدي (وَشْحُوبي). فالتشكيل
    حَكَم بين قراءتين يراهما المحرك متساويتين، لا بديل عن نطق المحرك.
    يرجع (wazn, alts, cond):
      - لا تعادل في الصيغة الأكثر ورودًا: وزنها كما هو.
      - تعادل حسمته الصيغ المشكولة باتفاق: الوزن المحسوم.
      - صيغ مشكولة تختار قراءات مختلفة من التعادل: مشروط.
      - لم يحسم شيء: الأرجح مع بدائله."""
    forms = [(f or "").replace("\u0640", "").strip() for f in forms]
    forms = [f for f in forms if f]
    if not forms:
        return None, [], []
    base, alts = scan(DIAC.sub("", forms[0]), tokenize, generate)
    if not base or not alts:
        return base, alts, []
    options = [base] + alts
    votes = {}
    for f in sorted(set(forms), key=lambda x: -len(DIAC_MARKS.findall(x))):
        # نفس الحروف تمامًا (الهمزة منها): "واحكُمِ" فعل أمر لا "وأحكم"
        if not DIAC_MARKS.search(f) or DIAC.sub("", f) != DIAC.sub("", forms[0]):
            continue
        b, a = scan(f, tokenize, generate)
        if b in options and not a:
            votes.setdefault(b, f)
    if len(votes) == 1:
        return next(iter(votes)), [], []
    if len(votes) > 1:
        return base, [], [f"{f}:{b}" for b, f in votes.items()]
    return base, alts, []


def la_naam(bits):
    """تحويل 1/0 إلى لا/نعم كما في الميزان: 10 = لا، 110 = نعم. ما لا يتحلل يُترك."""
    out, i = [], 0
    while i < len(bits) and bits[i] == "0":  # ساكن في أول الكلمة يتصل بما قبلها (لام ال)
        out.append("ـْ"); i += 1
    while i < len(bits):
        if bits.startswith("110", i):
            out.append("نعم"); i += 3
        elif bits.startswith("10", i):
            out.append("لا"); i += 2
        else:
            out.append(bits[i:]); break
    return " ".join(out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--mizan", required=True, help="مسار مستودع mizan-alnabt")
    ap.add_argument("--rhymes", default="out/rhymes.csv")
    a = ap.parse_args()
    tok, gen = load_engine(a.mizan)

    with open(a.rhymes, encoding="utf-8-sig") as fh:
        rd = csv.DictReader(fh)
        fields = [f for f in rd.fieldnames if f not in ("wazn", "wazn_alts", "wazn_cond")]
        rows = list(rd)

    st = collections.Counter()
    t0 = time.time()
    for i, r in enumerate(rows):
        forms = [x for x in r["top_forms"].split("|") if x] or [r["rhyme_norm"]]
        best, alts, cond = scan_variants(forms, tok, gen)
        r["wazn"] = best or ""
        r["wazn_alts"] = "|".join(alts)
        r["wazn_cond"] = "|".join(cond)
        st["ok" if best else "failed"] += 1
        st["ambiguous"] += bool(alts)
        st["conditional"] += bool(cond)
        if i % 50000 == 0:
            print(f"{i}/{len(rows)}  {time.time() - t0:.0f}s", flush=True)

    tmp = a.rhymes + ".tmp"
    with open(tmp, "w", encoding="utf-8-sig", newline="") as fh:
        wr = csv.DictWriter(fh, fieldnames=fields + ["wazn", "wazn_alts", "wazn_cond"])
        wr.writeheader()
        wr.writerows(rows)
    os.replace(tmp, a.rhymes)
    st["seconds"] = round(time.time() - t0)
    print(dict(st))


if __name__ == "__main__":
    main()
