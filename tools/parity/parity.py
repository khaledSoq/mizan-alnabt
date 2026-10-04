#!/usr/bin/env python3
"""parity.py: يقارن محرك بايثون (engine/) بمحرك الموقع (docs/engine.js) سطرًا سطرًا.

الأسطر: أمثلة صفحة الميزان، وشواهد قديمة من بيانات القوافي (docs/qawafi/data/w) إن وُجدت.
الاستعمال: python tools/parity/parity.py [--max-diffs N] [--lines 400]   (يحتاج node)
يخرج برمز 1 إن زادت الاختلافات عن N. الاختلافات المعروفة تعادل في الكلفة يُكسر
بترتيب مختلف بين النسختين، والدرجة تُقارن بسماحية ٠٫١٪ بسبب اختلاف التقريب."""
import argparse, glob, json, os, re, subprocess, sys, tempfile
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, ROOT)
from engine.engine import weigh_hemistich

ap = argparse.ArgumentParser()
ap.add_argument("--max-diffs", type=int, default=0)
ap.add_argument("--lines", type=int, default=400, help="عدد شواهد الأرشيف")
a = ap.parse_args()

src = open(os.path.join(ROOT, "scripts", "build-static.py"), encoding="utf-8").read()
lines = []
for m in re.finditer(r'sadr: "([^"]+)", ajz: "([^"]+)"', src):
    lines += [m.group(1), m.group(2)]
lines = list(dict.fromkeys(lines))
n_ex = len(lines)
wit = []
for f in sorted(glob.glob(os.path.join(ROOT, "docs", "qawafi", "data", "w", "*.json")),
                key=lambda p: int(os.path.basename(p)[:-5]))[:16]:
    for vid, (s, aj, *_ ) in sorted(json.load(open(f, encoding="utf-8")).items(), key=lambda kv: int(kv[0])):
        for t in (s, aj):
            t = re.sub(r"[\u064B-\u0652\u0640]", "", t or "").strip()
            if 6 <= len(t) <= 60:
                wit.append(t)
lines += list(dict.fromkeys(wit))[: a.lines]

with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False, encoding="utf-8") as fh:
    fh.write("\n".join(lines))
js = subprocess.run(["node", os.path.join(ROOT, "tools/parity/run_js.cjs"), fh.name],
                    capture_output=True, text=True, check=True).stdout
os.unlink(fh.name)
diffs, n = [], 0
for line in js.splitlines():
    j = json.loads(line)
    r = weigh_hemistich(j["t"], j["meter"])
    py = {"bits": r.bits or "", "id": r.meter_id or "", "score": round((r.score or 0) * 1000)}
    n += 1
    if (py["bits"], py["id"]) != (j["bits"], j["id"]) or abs(py["score"] - j["score"]) > 1:
        diffs.append((j["meter"], j["t"], py, {k: j[k] for k in ("bits", "id", "score")}))
print(f"أسطر: {len(lines)} ({n_ex} أمثلة)   أوزان: {n}   اختلافات: {len(diffs)} (المسموح {a.max_diffs})")
for d in diffs[:15]:
    print(" ", d[0], "|", d[1], "\n    py:", d[2], "\n    js:", d[3])
sys.exit(1 if len(diffs) > a.max_diffs else 0)
