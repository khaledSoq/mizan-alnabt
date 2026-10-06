#!/usr/bin/env python3
"""build_vocab.py: فهرس مفردات الأشعار لصفحة المرادفات.

يقرأ كل الأبيات (verses.jsonl.gz من build_qawafi.py)، ويعدّ كل كلمة، ويربط كل أصل بصيغه
التي وردت فعلًا: "حسن" يُعرف بحُسنها وبحسنك والحسن. لا يولّد صيغة لم ترد.
الأصل يُعرف بنزع السوابق والضمائر واللواحق من الكلمة الواردة، والأصول الأقصر من ثلاثة أحرف لا تُفهرس.

المخرج: <out>/v/<0..255>.json، كل ملف {أصل: [[الصيغة كما كُتبت غالبًا، عدد ورودها], ...]}.
الملف يُختار بـ FNV-1a على الأصل، والصفحة تحسبه بنفس الدالة.

الاستعمال: python build_vocab.py --verses out/verses.jsonl.gz --out ../../docs/qawafi/data
"""
import argparse, collections, gzip, json, os, re, time

DIAC = re.compile(r"[\u0610-\u061A\u064B-\u065F\u0670\u0640]")
TOKEN = re.compile(r"[\u0621-\u064A\u0610-\u061A\u064B-\u065F\u0670\u0640]+")
UNIFY = str.maketrans({"أ": "ا", "إ": "ا", "آ": "ا", "ٱ": "ا", "ى": "ي", "ة": "ه"})
SKIP_KINDS = {"عامي", "شعبي"}  # العامي غير المعتمد مستبعد كما في الأرشيف، والنبطي المعتمد داخل
PREFIXES = ["وبال", "وال", "فال", "بال", "كال", "ولل", "لل", "ال", "وب", "ول", "فل", "فب", "و", "ف", "ب", "ل", "ك", ""]
SUFFIXES = ["هما", "كما", "هم", "هن", "كم", "كن", "ها", "نا", "ني", "ات", "ون", "ين", "ان", "ه", "ي", "ك", ""]
BUCKETS = 256
MIN_COUNT = 2
MAX_FORMS = 80


def fnv1a(s):
    h = 0x811C9DC5
    for ch in s:
        h ^= ord(ch)
        h = (h * 0x01000193) & 0xFFFFFFFF
    return h


def stems(w):
    out = set()
    for p in PREFIXES:
        if not w.startswith(p):
            continue
        r = w[len(p):]
        for s in SUFFIXES:
            if s and not r.endswith(s):
                continue
            st = r[: len(r) - len(s)] if s else r
            if len(st) >= 3:
                out.add(st)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--verses", required=True)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    t0 = time.time()
    count = collections.Counter()
    spell = collections.defaultdict(collections.Counter)  # الكتابة الغالبة بلا تشكيل (تحفظ ة وأ)
    with gzip.open(a.verses, "rt", encoding="utf-8") as fh:
        for line in fh:
            v = json.loads(line)
            if v.get("kind") in SKIP_KINDS:
                continue
            for part in (v.get("sadr") or "", v.get("ajz") or ""):
                for t in TOKEN.findall(part):
                    raw = DIAC.sub("", t)
                    key = raw.translate(UNIFY)
                    if len(key) < 2:
                        continue
                    count[key] += 1
                    spell[key][raw] += 1
    index = collections.defaultdict(list)
    for key, n in count.items():
        if n < MIN_COUNT:
            continue
        shown = spell[key].most_common(1)[0][0]
        for st in stems(key):
            index[st].append((n, shown))
    os.makedirs(os.path.join(a.out, "v"), exist_ok=True)
    buckets = [dict() for _ in range(BUCKETS)]
    for st, forms in index.items():
        forms.sort(key=lambda x: -x[0])
        buckets[fnv1a(st) % BUCKETS][st] = [[f, n] for n, f in forms[:MAX_FORMS]]
    sizes = []
    for i, b in enumerate(buckets):
        p = os.path.join(a.out, "v", f"{i}.json")
        with open(p, "w", encoding="utf-8") as fh:
            json.dump(b, fh, ensure_ascii=False, separators=(",", ":"), sort_keys=True)
        sizes.append(os.path.getsize(p))
    stats = {"tokens": sum(count.values()), "forms": len(count),
             "forms_indexed": sum(1 for n in count.values() if n >= MIN_COUNT), "stems": len(index),
             "vocab_mb": round(sum(sizes) / 1e6, 1), "largest_kb": round(max(sizes) / 1e3), "seconds": round(time.time() - t0)}
    meta_p = os.path.join(a.out, "meta.json")
    meta = json.load(open(meta_p, encoding="utf-8")) if os.path.exists(meta_p) else {}
    meta["vocab"] = stats
    json.dump(meta, open(meta_p, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(json.dumps(stats, ensure_ascii=False))


if __name__ == "__main__":
    main()
