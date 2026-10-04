#!/usr/bin/env python3
"""build_qawafi.py: يبني أرشيف القوافي من مجموعة Ashaar (ملفات parquet).

المخرجات في مجلد out/:
  rhymes.csv        قافية مطبّعة لكل سطر، مع التكرار حسب الموضع والنوع وعدد الشعراء وأمثلة
                    (النوع: فصيح، نبطي لشعراء nabati_poets.json، عامي لغيرهم، غير مصنف)
                    (قوافي العجز كلها، وقوافي الصدر حين تتسق صدور القصيدة على حرف واحد)
  verses.jsonl.gz   كل بيت حامل لقافية، مع الشاعر والعصر والبحر والروابط
  stats.json        إحصاءات البناء للتحقق

الاستعمال:
  python build_qawafi.py --download            # أول مرة: ينزّل البيانات ثم يبني
  python build_qawafi.py --data data/ --out out/
المتطلبات: pip install pyarrow
"""
import argparse, collections, csv, glob, gzip, hashlib, json, os, re
import pyarrow.parquet as pq

# ---------- التطبيع ----------
DIACRITICS = re.compile(r"[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]")  # تشكيل + تطويل
NON_LETTER = re.compile(r"[^\u0621-\u064A\s]")  # كل ما ليس حرفًا عربيًا أو مسافة
UNIFY = str.maketrans({"أ": "ا", "إ": "ا", "آ": "ا", "ٱ": "ا", "ى": "ي", "ة": "ه"})
RAW_KEEP = re.compile(r"[^\u0621-\u064A\u0610-\u061A\u064B-\u065F\u0670\u0671]")  # يحفظ التشكيل


def norm(text: str) -> str:
    text = DIACRITICS.sub("", text or "")
    text = text.replace("\u0671", "ا")
    text = NON_LETTER.sub(" ", text)
    return " ".join(text.translate(UNIFY).split())


def last_word_raw(text: str) -> str:
    for tok in reversed((text or "").split()):
        tok = RAW_KEEP.sub("", tok).replace("\u0640", "")
        if norm(tok):
            return tok
    return ""


NON_METRIC = re.compile(r"نثر|تفعيل|شعر حر")  # نثرية وتفعيلة وحر: لا قافية ملتزمة


def clean_meter(m):
    m = (m or "").strip()
    return re.sub(r"^بحر\s+", "", m) or None


KIND = {"فصيح": "فصيح", "فصحى": "فصيح", "عامي": "عامي", "شعبي": "عامي"}


def load_nabati() -> set:
    """شعراء النبط المعتمدون (nabati_poets.json): عاميّهم يصير "نبطي"، وعامي غيرهم يبقى مستبعدًا."""
    with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "nabati_poets.json"), encoding="utf-8") as fh:
        d = json.load(fh)
    return {n.strip() for names in d["country"].values() for n in names} | {n.strip() for n in d["dialect_only"]}


ITLAQ = "اويه"  # حروف قد تأتي بعد الروي (إطلاق، وصل، واو جماعة وألفها)


def rawi_keys(w: str) -> set:
    """مفاتيح محتملة للروي: الحرف الأخير، وما قبل حرفي إطلاق/وصل كحد أقصى.
    'A' صنف واحد للألف والياء الأخيرتين (الهوى/دعا بعد طي ى إلى ي)."""
    k = {w[-1]}
    if w[-1] in "اي":
        k.add("A")
    i = len(w) - 1
    while i >= 2 and w[i] in ITLAQ and len(w) - i <= 2:
        i -= 1
        k.add(w[i])
    return k


SADR_MIN_BAITS = 4   # أقل عدد أبيات لاختبار قافية الصدر
SADR_SHARE = 0.8     # نسبة الصدور التي يجب أن تتفق على حرف واحد


# رموز قصيرة لعمود sample_ids: النوع ثم الموضع ثم رقم البيت، مثل fj123 = فصيح، عجز، بيت 123
CODE = {"فصيح": "f", "عامي": "a", "نبطي": "n", "غير_مصنف": "u", "عجز": "j", "صدر": "s"}


def add_word(words, w, kind, pos, pid, raw, vid):
    d = words.get(w)
    if d is None:
        d = words[w] = {"cnt": collections.Counter(), "poets": collections.defaultdict(set),
                        "forms": collections.Counter(), "samples": collections.defaultdict(list)}
    key = (kind, pos)
    d["cnt"][key] += 1
    d["poets"][key].add(pid)
    d["forms"][raw] += 1
    if len(d["samples"][key]) < 2:  # شاهدان لكل نوع وموضع
        d["samples"][key].append(f"{CODE[kind]}{CODE[pos]}{vid}")


def vkey(sadr: str, ajz: str) -> bytes:
    return hashlib.blake2b(f"{norm(sadr)}|{norm(ajz)}".encode(), digest_size=8).digest()


# ---------- البناء ----------
HF = "https://huggingface.co/datasets/arbml/ashaar/resolve/main/data/"
PARTS = ["train-00000-of-00002.parquet", "train-00001-of-00002.parquet"]


def download(data_dir: str) -> None:
    """ينزّل ملفي Ashaar (قرابة ٢٨٠ ميغابايت) إن لم يكونا موجودين."""
    import urllib.request
    os.makedirs(data_dir, exist_ok=True)
    for p in PARTS:
        dst = os.path.join(data_dir, "ashaar_" + p)
        if not os.path.exists(dst):
            print("downloading", p)
            urllib.request.urlretrieve(HF + p, dst + ".part")
            os.replace(dst + ".part", dst)


def build(data_dir: str, out_dir: str) -> None:
    os.makedirs(out_dir, exist_ok=True)
    files = sorted(glob.glob(os.path.join(data_dir, "*.parquet")))
    cols = ["poem verses", "poem url", "poet name", "poet era", "poem meter", "poem language type"]

    st = collections.Counter()
    seen = {}                                   # بصمة البيت -> رقمه
    extra_urls = collections.defaultdict(list)  # روابط إضافية للأبيات المكررة
    words = {}                                  # القافية المطبّعة -> بيانات التجميع
    poet_ids = {}
    nabati = load_nabati()

    tmp_path = os.path.join(out_dir, "verses.tmp.gz")
    with gzip.open(tmp_path, "wt", encoding="utf-8") as tmp:
        for f in files:
            for batch in pq.ParquetFile(f).iter_batches(batch_size=2000, columns=cols):
                for p in batch.to_pylist():
                    st["poems"] += 1
                    meter = clean_meter(p["poem meter"])
                    if meter and NON_METRIC.search(meter):
                        st["poems_excluded_nonmetric"] += 1
                        continue
                    lines = [l for l in (p["poem verses"] or []) if l and norm(l)]
                    if not lines:
                        st["poems_empty"] += 1
                        continue
                    odd = len(lines) % 2 == 1
                    st["poems_odd" if odd else "poems_even"] += 1
                    # المرشحون: كل عجز في القصائد الزوجية، وكل شطر في الفردية
                    if odd:
                        cands = [(lines[i - 1] if i else "", lines[i]) for i in range(len(lines))]
                    else:
                        cands = [(lines[i], lines[i + 1]) for i in range(0, len(lines), 2)]
                    lw = [norm(a).split()[-1] for _, a in cands]
                    ks = [rawi_keys(w) for w in lw]
                    dom = collections.Counter(x for k in ks for x in k).most_common(1)[0][0]

                    # قاعدة ب: قافية الصدر، في القصائد الزوجية فقط لأن تناوب الفردية غير موثوق
                    sw = [None] * len(cands)
                    s_ok = [False] * len(cands)
                    if not odd and len(cands) >= SADR_MIN_BAITS:
                        sw = [norm(s).split()[-1] for s, _ in cands]
                        sks = [rawi_keys(w) for w in sw]
                        sdom = collections.Counter(x for k in sks for x in k).most_common(1)[0][0]
                        if sum(sdom in k for k in sks) / len(sks) >= SADR_SHARE:
                            st["poems_sadr_rhymed"] += 1
                            s_ok = [sdom in k for k in sks]

                    kind = KIND.get((p["poem language type"] or "").strip(), "غير_مصنف")
                    poet = (p["poet name"] or "").strip()
                    if kind == "عامي" and poet in nabati:
                        kind = "نبطي"
                    pid = poet_ids.setdefault(poet, len(poet_ids))
                    url = p["poem url"] or ""

                    for i, ((sadr, ajz), w, k) in enumerate(zip(cands, lw, ks)):
                        st["candidates"] += 1
                        st["candidates_odd" if odd else "candidates_even"] += 1
                        a_ok = dom in k
                        if not a_ok:
                            st["rejected_letter"] += 1
                            st["rejected_odd" if odd else "rejected_even"] += 1
                        if not a_ok and not s_ok[i]:
                            continue
                        h = vkey(sadr, ajz)
                        if h in seen:
                            st["duplicates"] += 1
                            vid = seen[h]
                            if url and len(extra_urls[vid]) < 10:
                                extra_urls[vid].append(url)
                            continue
                        vid = len(seen)
                        seen[h] = vid
                        raw = last_word_raw(ajz) if a_ok else None
                        raw_s = last_word_raw(sadr) if s_ok[i] else None
                        rec = {"id": vid, "sadr": sadr.strip(), "ajz": ajz.strip(),
                               "rhyme": raw, "rhyme_norm": w if a_ok else None,
                               "sadr_rhyme": raw_s, "sadr_rhyme_norm": sw[i] if s_ok[i] else None,
                               "poet": poet, "era": p["poet era"], "meter": meter,
                               "kind": kind, "urls": [url] if url else [], "odd_poem": odd}
                        tmp.write(json.dumps(rec, ensure_ascii=False) + "\n")
                        st["verses_kept"] += 1
                        st[f"kind_{kind}"] += 1
                        if a_ok:
                            st["rhymes_ajz"] += 1
                            add_word(words, w, kind, "عجز", pid, raw, vid)
                        if s_ok[i]:
                            st["rhymes_sadr"] += 1
                            add_word(words, sw[i], kind, "صدر", pid, raw_s, vid)
            print(f"done {os.path.basename(f)}: {st['poems']} poems, {st['verses_kept']} verses")

    # تمريرة ثانية: دمج روابط المكرر في الملف النهائي
    with gzip.open(tmp_path, "rt", encoding="utf-8") as src, \
         gzip.open(os.path.join(out_dir, "verses.jsonl.gz"), "wt", encoding="utf-8") as dst:
        for line in src:
            rec = json.loads(line)
            if rec["id"] in extra_urls:
                rec["urls"] = list(dict.fromkeys(rec["urls"] + extra_urls[rec["id"]]))
            dst.write(json.dumps(rec, ensure_ascii=False) + "\n")
    os.remove(tmp_path)

    with open(os.path.join(out_dir, "rhymes.csv"), "w", encoding="utf-8-sig", newline="") as fh:
        wr = csv.writer(fh)
        wr.writerow(["rhyme_norm", "length", "total", "ajz", "sadr", "fasih", "ammi",
                     "unclassified", "nabati", "n_poets", "top_forms", "sample_ids", "breakdown"])
        for w, d in sorted(words.items(), key=lambda kv: -sum(kv[1]["cnt"].values())):
            c = d["cnt"]
            by = lambda i, v: sum(n for key, n in c.items() if key[i] == v)
            keys = sorted(c)
            wr.writerow([w, len(w), sum(c.values()), by(1, "عجز"), by(1, "صدر"),
                         by(0, "فصيح"), by(0, "عامي"), by(0, "غير_مصنف"), by(0, "نبطي"),
                         len(set().union(*d["poets"].values())),
                         "|".join(f for f, _ in d["forms"].most_common(3)),
                         "|".join(x for k in keys for x in d["samples"][k]),
                         "|".join(f"{kd}:{ps}:{c[(kd, ps)]}:{len(d['poets'][(kd, ps)])}"
                                  for kd, ps in keys)])

    st["unique_rhymes"] = len(words)
    st["poets"] = len(poet_ids)
    with open(os.path.join(out_dir, "stats.json"), "w", encoding="utf-8") as fh:
        json.dump(dict(st), fh, ensure_ascii=False, indent=2)
    print(json.dumps(dict(st), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", default="data")
    ap.add_argument("--out", default="out")
    ap.add_argument("--download", action="store_true", help="نزّل بيانات Ashaar أولًا")
    a = ap.parse_args()
    if a.download:
        download(a.data)
    build(a.data, a.out)
