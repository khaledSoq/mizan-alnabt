#!/usr/bin/env python3
"""test_wazn.py: يقيس عمود الوزن على مراجعة خالد للخمسين (wazn_gold_50.json).
صحيح = الوزن الأرجح ضمن المقبول. "متعادل حقيقي" يُحسب صحيحًا إن عُلّم متعادلًا.
الاستعمال: python test_wazn.py --mizan ../mizan-alnabt --rhymes out/rhymes.csv"""
import argparse, csv, json, sys
from build_qawafi import norm
from wazn import load_engine, scan, scan_variants, DIAC

ap = argparse.ArgumentParser(); ap.add_argument("--mizan", required=True); ap.add_argument("--rhymes", default="out/rhymes.csv")
ap.add_argument("--min", type=int, default=0, help="افشل إن نزلت النتيجة عن هذا الحد (حارس في Actions)")
a = ap.parse_args()
tok, gen = load_engine(a.mizan)
gold = json.load(open("wazn_gold_50.json", encoding="utf-8"))
want = {norm(g["word"]).replace(" ", ""): g for g in gold}
rows = {}
for r in csv.DictReader(open(a.rhymes, encoding="utf-8-sig")):
    if r["rhyme_norm"] in want and r["rhyme_norm"] not in rows:
        rows[r["rhyme_norm"]] = r
score = {"v1": 0, "v2": 0}; n = 0; lines = []
for key, g in want.items():
    r = rows.get(key)
    if not r: lines.append(f"?? {g['word']} غير موجودة"); continue
    forms = [x for x in r["top_forms"].split("|") if x]
    v1, v1a = scan(DIAC.sub("", forms[0]), tok, gen)
    v2, v2a, cond = scan_variants(forms, tok, gen)
    acc = g["accept"]; n += 1
    ok = lambda b, alts, c=(): (bool(alts) or bool(c)) if acc is None else (b in acc or any(x.split(":")[1] in acc for x in c) and set(x.split(":")[1] for x in c) <= set(acc))
    k1, k2 = ok(v1, v1a), ok(v2, v2a, cond)
    score["v1"] += k1; score["v2"] += k2
    mark = "  " if k1 == k2 else ("↑ " if k2 else "↓ ")
    lines.append(f"{mark}{g['n']:>2} {g['word']:10} مقبول={acc}  قبل={v1}{'✓' if k1 else '✗'}  بعد={v2}{'✓' if k2 else '✗'} {('مشروط ' + ' '.join(cond)) if cond else ''}{('بدائل ' + ','.join(v2a)) if v2a else ''}  صيغ={forms}")
print("\n".join(lines)); print(f"\nقبل: {score['v1']}/{n}   بعد: {score['v2']}/{n}")
if score["v2"] < a.min:
    sys.exit(f"تراجع الوزن: {score['v2']} أقل من الحد {a.min}")
