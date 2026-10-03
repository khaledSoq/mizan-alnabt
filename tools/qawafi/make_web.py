#!/usr/bin/env python3
"""make_web.py: يحوّل مخرجات البناء إلى بيانات صفحة القوافي.

المدخلات: out/rhymes.csv (مع أعمدة الوزن) و out/verses.jsonl.gz
المخرجات في docs/qawafi/data/:
  rhymes.tsv       كل القوافي في ملف واحد (للبحث في الأرشيف كله داخل المتصفح)
                   الأعمدة: القافية، الصيغة (فارغة إن طابقت)، العدد، الشعراء، الوزن،
                   البدائل، المشروط، أرقام الشواهد مفصولة بفاصلة
  w/<n>.json       الشواهد في ٢٥٦ دلوًا حسب رقم البيت (رقم % 256)، تُجلب عند فتح البطاقة
  meta.json        تاريخ البناء والأعداد

قرارات خالد المطبّقة هنا:
  - العامي مستبعد حتى يُجمع النبطي الحقيقي (أعداده تُطرح، وما كان عاميًا فقط يُحذف).
  - الصدر والعجز معاملة واحدة.
  - الشاهد القديم يُنشر كاملًا، والحديث ومجهول العصر رابط المصدر فقط.
"""
import argparse, collections, csv, datetime, gzip, json, os

BUCKETS = 256

EXCLUDED_KIND = "عامي"
MODERN = {None, "", "العصر الحديث"}
CODE_KIND = {"f": "فصيح", "a": "عامي", "u": "غير_مصنف"}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--rhymes", default="out/rhymes.csv")
    ap.add_argument("--verses", default="out/verses.jsonl.gz")
    ap.add_argument("--out", default="docs/qawafi/data")
    ap.add_argument("--witnesses", type=int, default=2, help="عدد الشواهد لكل قافية")
    a = ap.parse_args()
    os.makedirs(os.path.join(a.out, "w"), exist_ok=True)

    rows, need, st = [], {}, collections.Counter()
    with open(a.rhymes, encoding="utf-8-sig") as fh:
        for r in csv.DictReader(fh):
            st["input"] += 1
            n = poets = 0
            for part in r["breakdown"].split("|"):
                kd, ps, c, pt = part.split(":")
                if kd != EXCLUDED_KIND:
                    n += int(c); poets += int(pt)
            if not n:
                st["dropped_ammi_only"] += 1
                continue
            # كل الشواهد المرشحة (حتى شاهدين لكل نوع وموضع)، ويُختار منها لاحقًا القديم أولًا
            ids = []
            for x in r["sample_ids"].split("|"):
                if x and CODE_KIND.get(x[0]) != EXCLUDED_KIND and int(x[2:]) not in ids:
                    ids.append(int(x[2:]))
            w = r["rhyme_norm"]
            for i in ids:
                need[i] = None
            form = (r["top_forms"].split("|")[0] or w).replace("\u0640", "")
            rows.append([w, "" if form == w else form, n, poets, r.get("wazn", ""),
                         r.get("wazn_alts", ""), r.get("wazn_cond", ""), ids])

    rows.sort(key=lambda x: -x[2])
    with gzip.open(a.verses, "rt", encoding="utf-8") as fh:
        for line in fh:
            vid = int(line[7:line.index(",")])
            if vid in need:
                need[vid] = json.loads(line)
    shards = collections.defaultdict(dict)
    for r in rows:
        cands = [int(x) for x in r[7].split(",") if x] if isinstance(r[7], str) else r[7]
        cands = [i for i in cands if need.get(i)]
        cands.sort(key=lambda i: need[i].get("era") in MODERN)  # القديم أولًا
        chosen = cands[: a.witnesses]
        r[7] = ",".join(map(str, chosen))
        for vid in chosen:
            v = need[vid]
            classical = v.get("era") not in MODERN
            st["witness_classical" if classical else "witness_link_only"] += 1
            shards[vid % BUCKETS][vid] = [v["sadr"] if classical else "", v["ajz"] if classical else "",
                                          v.get("poet") or "", v.get("era") or "", (v.get("urls") or [""])[0]]

    sizes = {}
    def dump(path, obj):
        data = json.dumps(obj, ensure_ascii=False, separators=(",", ":")).encode()
        with open(path, "wb") as fh:
            fh.write(data)
        sizes[os.path.relpath(path, a.out)] = len(data)

    tsv = "\n".join("\t".join(map(str, r)) for r in rows).encode()
    with open(os.path.join(a.out, "rhymes.tsv"), "wb") as fh:
        fh.write(tsv)
    sizes["rhymes.tsv"] = len(tsv)
    for b, d in shards.items():
        dump(os.path.join(a.out, "w", f"{b}.json"), d)
    meta = {"built": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d"), "rhymes": len(rows),
            "buckets": BUCKETS, "stats": dict(st)}
    dump(os.path.join(a.out, "meta.json"), meta)

    total = sum(sizes.values())
    gz = sum(len(gzip.compress(open(os.path.join(a.out, p), "rb").read(), 6)) for p in sizes)
    print(json.dumps({**meta, "rhymes_tsv_mb": round(sizes["rhymes.tsv"] / 2**20, 2),
                      "rhymes_tsv_gzip_mb": round(len(gzip.compress(tsv, 6)) / 2**20, 2),
                      "largest_shard_mb": round(max(v for k, v in sizes.items() if k.startswith("w")) / 2**20, 2),
                      "total_mb": round(total / 2**20, 1), "total_gzip_mb": round(gz / 2**20, 1)},
                     ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
