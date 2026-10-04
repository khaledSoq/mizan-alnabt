// siwar-proxy.js: وسيط سوار لأرشيف القوافي (Cloudflare Worker)
//
// الإعداد في لوحة Cloudflare (لا شيء من هذا في الكود):
//   SIWAR_API_KEY    سرّ (Secret): مفتاح سوار
//   QAWAFI_KV        ربط KV (اختياري): الذاكرة الدائمة. بدونه يعمل الوسيط بلا حفظ
//   ALLOWED_ORIGINS  متغير نصي (اختياري): مواقع مسموحة مفصولة بفواصل
//
// المسارات:
//   /               صفحة اختبار
//   /lookup?w=كلمة  المجموعات المقطّرة والمرتبة
//   /health         فحص الإعداد

const VERSION = "v1"; // غيّره عند تعديل منطق التقطير ليُتجاهل المحفوظ القديم
const SIWAR = "https://siwar.ksaa.gov.sa/api/v1/external/public/search";

// المعاجم العامة الخمسة. ترتيب العرض داخل المجموعة: المعاصر القصير أولًا، والمحيط آخرًا
const LEXICONS = {
  "Riyadh": { code: "رياض", order: 0 },
  "93004a81-d924-49d3-9970-42218cf74311": { code: "طلاب٣", order: 1 },
  "a33c935c-2dc5-4147-a19d-4ea33abb6979": { code: "طلاب٢", order: 2 },
  "c0458cdc-7de7-401e-8078-365eaf63782a": { code: "طلاب١", order: 3 },
  "2202f51d-7d70-4472-9fc0-f178fb425463": { code: "محيط", order: 4 },
};
// فاصلة بلا مسافة: مع المسافة يقرأ سوار المعرّف الأول فقط (ثبت في الاستكشاف الثاني)
const LEXICON_IDS = Object.keys(LEXICONS).join(",");

const DEFAULT_ORIGINS = ["https://khaledsoq.github.io"];
const LOCAL_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

// كلمات وظيفية: معناها لا يفيد الشاعر، وردودها من أثقل الردود
const STOP = new Set(`على علي عليه عليها عليهم عليك إلى الى إليه اليه إليها اليها إليك اليك
في فيه فيها فيهم فيك من منه منها منهم منك مني عن عنه عنها عنهم عنك عني
لي له لها لهم لك به بها بهم بك بي معي معه معها معك
أنا انا أنت انت أنتِ انتي هو هي هم هن نحن أنتم انتم
ما لا يا إن ان أن قد لم لن كان كي حتى إذا اذا إذ اذ ثم أو او أم ام بل لو كم مع
هذا هذه ذلك تلك الذي التي اللي ذا ذي`.split(/\s+/).filter(Boolean));

const DIAC = /[\u0610-\u061A\u064B-\u065F\u0670\u0640]/g;
const UNIFY = { "أ": "ا", "إ": "ا", "آ": "ا", "ٱ": "ا", "ى": "ي", "ة": "ه" };
const noDiac = (s) => (s || "").replace(DIAC, "").trim();
const bare = (s) => noDiac(s).replace(/[أإآٱىة]/g, (c) => UNIFY[c]);

const LIMITS = { groups: 12, entries: 8, senses: 6, def: 1500, ex: 3, rel: 12 };
const mem = new Map(); // ذاكرة قصيرة داخل نفس النسخة، مجانية

// ---------- البحث البديل حين لا تأتي نتيجة ----------
function fallbacks(word) {
  const out = [];
  const add = (w, via) => { if (w.length >= 3 && w !== word && !out.some((x) => x.q === w)) out.push({ q: w, via }); };
  let w = word;
  const pro = w.match(/^([وفبلك])(ال)?(.{3,})$/);
  if (w.startsWith("ال")) add(w.slice(2), "بلا ال");
  if (pro) add(pro[3], "بلا سابقة");
  const suf = (x) => { const m = x.match(/^(.{3,}?)(هما|هم|هن|كم|كن|نا|ها|ه|ي|ك)$/); return m ? m[1] : null; };
  for (const base of [w, w.startsWith("ال") ? w.slice(2) : null, pro ? pro[3] : null]) {
    const s = base && suf(base);
    if (s) add(s, "بلا ضمير");
  }
  return out.slice(0, 3); // حد الطلبات الفرعية
}

// ---------- التقطير وإعادة الترتيب ----------
function distill(data, selfSet) {
  const groups = new Map();
  for (const e of Array.isArray(data) ? data : []) {
    const lx = LEXICONS[e.lexiconId];
    if (!lx || (e.lemmaType && e.lemmaType !== "singleWord")) continue;
    const b = bare(e.nonDiacriticsLemma || e.lemma);
    if (!b || b.includes(" ")) continue;
    const senses = [];
    for (const s of e.senses || []) {
      const d = (s.definition || "").trim();
      const rel = (s.relations || []).filter((r) => r.type)
        .map((r) => [r.type, r.related || r.entryLemmaOfRelated]).slice(0, LIMITS.rel);
      const ex = (s.examples || []).map((x) => x.word).filter(Boolean).slice(0, LIMITS.ex);
      if (!d && !rel.length && !ex.length) continue;
      const sense = { d: d.length > LIMITS.def ? d.slice(0, LIMITS.def) + "…" : d };
      if (rel.length) sense.rel = rel;
      if (ex.length) sense.ex = ex;
      senses.push(sense);
      if (senses.length >= LIMITS.senses) break;
    }
    if (!groups.has(b)) groups.set(b, { bare: b, order: groups.size, entries: [] });
    groups.get(b).entries.push({
      id: e.lexicalEntryId || e._id, lemma: e.lemma, lex: lx.code, _o: lx.order,
      pos: (e.pos || "").trim() || null, root: (e.root || "").trim() || null,
      pattern: (e.pattern || "").trim() || null, senses,
    });
  }
  // الكلمة نفسها أولًا، والجذوع القصيرة (حرفان) آخرًا، ثم ترتيب سوار
  return [...groups.values()]
    .map((g) => ({ ...g, self: selfSet.has(g.bare), short: g.bare.length < 3 }))
    .sort((a, b) => (b.self - a.self) || (a.short - b.short) || (a.order - b.order))
    .slice(0, LIMITS.groups)
    .map(({ bare, self, entries }) => ({
      bare, self,
      entries: entries.sort((x, y) => x._o - y._o).slice(0, LIMITS.entries).map(({ _o, ...rest }) => rest),
    }));
}

async function siwar(env, q) {
  const url = `${SIWAR}?${new URLSearchParams({ query: q, lexiconIds: LEXICON_IDS })}`;
  const r = await fetch(url, { headers: { apikey: env.SIWAR_API_KEY, Accept: "application/json" } });
  if (!r.ok) throw new Error(`siwar ${r.status}`);
  return r.json();
}

async function lookup(env, ctx, word) {
  const key = `${VERSION}:${word}`;
  if (mem.has(key)) return { ...mem.get(key), cached: "mem" };
  if (env.QAWAFI_KV) {
    const hit = await env.QAWAFI_KV.get(key, "json");
    if (hit) { mem.set(key, hit); return { ...hit, cached: "kv" }; }
  }
  let res;
  if (STOP.has(word)) {
    res = { word, stop: true, via: null, groups: [] };
  } else {
    const selfSet = new Set([bare(word), bare(word).replace(/^ال/, "")]);
    let groups = distill(await siwar(env, word), selfSet), via = "مباشر";
    if (!groups.length) {
      for (const f of fallbacks(word)) {
        selfSet.add(bare(f.q));
        groups = distill(await siwar(env, f.q), selfSet);
        if (groups.length) { via = `${f.via}: ${f.q}`; break; }
      }
    }
    res = { word, stop: false, via: groups.length ? via : null, groups };
  }
  mem.set(key, res);
  if (mem.size > 500) mem.delete(mem.keys().next().value);
  if (env.QAWAFI_KV) {
    // حصة الكتابة المجانية ألف يوميًا: إن نفدت نتجاهل الخطأ ونستمر بلا حفظ
    ctx.waitUntil(env.QAWAFI_KV.put(key, JSON.stringify(res), { expirationTtl: 60 * 60 * 24 * 180 }).catch(() => {}));
  }
  return { ...res, cached: null };
}

// ---------- HTTP ----------
function corsHeaders(request, env) {
  const origin = request.headers.get("Origin");
  if (!origin) return {};
  const allowed = (env.ALLOWED_ORIGINS ? env.ALLOWED_ORIGINS.split(",").map((s) => s.trim()) : DEFAULT_ORIGINS);
  if (allowed.includes(origin) || LOCAL_ORIGIN.test(origin)) {
    return { "Access-Control-Allow-Origin": origin, "Vary": "Origin", "Access-Control-Allow-Methods": "GET, OPTIONS" };
  }
  return {};
}

const json = (obj, status, extra) => new Response(JSON.stringify(obj), {
  status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...extra },
});

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const cors = corsHeaders(request, env);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "GET") return json({ error: "GET فقط" }, 405, cors);

    if (url.pathname === "/health") {
      return json({ ok: true, version: VERSION, hasKey: Boolean(env.SIWAR_API_KEY), hasKV: Boolean(env.QAWAFI_KV) }, 200, cors);
    }
    if (url.pathname === "/lookup") {
      const word = noDiac(url.searchParams.get("w"));
      if (!/^[\u0621-\u064A]{2,20}$/.test(word)) return json({ error: "كلمة عربية واحدة من ٢ إلى ٢٠ حرفًا" }, 400, cors);
      if (!env.SIWAR_API_KEY) return json({ error: "المفتاح غير مضبوط في إعدادات الوسيط" }, 500, cors);
      const t0 = Date.now();
      try {
        const res = await lookup(env, ctx, word);
        return json({ ...res, ms: Date.now() - t0 }, 200, cors);
      } catch (e) {
        return json({ error: String(e.message || e), word }, 502, cors);
      }
    }
    if (url.pathname === "/") {
      return new Response(TEST_PAGE, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }
    return json({ error: "غير موجود" }, 404, cors);
  },
};

const TEST_PAGE = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>وسيط سوار</title>
<style>
:root{--bg:#12100e;--surf:#211d18;--paper:#f3ead8;--ink:#1c1612;--fg:#f4efe6;--muted:#9a9186;--bd:#3a342d;--ok:#6b7f63}
body{margin:0;background:var(--bg);color:var(--fg);font-family:"Noto Naskh Arabic",Tahoma,sans-serif}
.w{max-width:40rem;margin:auto;padding:1rem}
form{display:flex;gap:.5rem}input{flex:1;font-size:1.3rem;padding:.6rem;border-radius:.5rem;border:1px solid var(--bd);background:var(--surf);color:var(--fg)}
button{font-size:1rem;padding:.6rem 1rem;border:0;border-radius:.5rem;background:var(--paper);color:var(--ink);font-weight:700}
.meta{color:var(--muted);font-size:.8rem;margin:.6rem 0}
details{background:var(--paper);color:var(--ink);border-radius:.6rem;margin:.5rem 0;padding:.5rem .8rem}
summary{font-size:1.25rem;font-weight:700;cursor:pointer}.self{color:var(--ok)}
.e{border-top:1px dashed #c9bba3;padding:.4rem 0}.tag{font-size:.75rem;background:#e4d7c0;border-radius:99px;padding:.1rem .5rem;margin-left:.3rem}
.d{line-height:1.8}.rel{font-size:.85rem;color:#5a4e42}
</style></head><body><div class="w">
<h2>وسيط سوار</h2><form id="f"><input id="q" placeholder="اكتب كلمة" autocomplete="off"><button>ابحث</button></form>
<div id="m" class="meta"></div><div id="r"></div></div>
<script>
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
document.getElementById("f").onsubmit=async ev=>{ev.preventDefault();
 const w=document.getElementById("q").value.trim();if(!w)return;
 const m=document.getElementById("m"),r=document.getElementById("r");m.textContent="…";r.innerHTML="";
 const t=performance.now();const res=await fetch("/lookup?w="+encodeURIComponent(w));const j=await res.json();
 m.textContent=j.error?("خطأ: "+j.error):("المجموعات: "+j.groups.length+" · الطريق: "+(j.via||"لا شيء")+(j.stop?" · كلمة وظيفية":"")+" · الذاكرة: "+(j.cached||"لا")+" · الخادم "+j.ms+"ms · الكلي "+Math.round(performance.now()-t)+"ms");
 if(j.error)return;
 r.innerHTML=j.groups.map((g,i)=>'<details'+(i===0?" open":"")+'><summary class="'+(g.self?"self":"")+'">'+esc(g.bare)+(g.self?" ✓":"")+'</summary>'+
  g.entries.map(e=>'<div class="e"><b>'+esc(e.lemma)+'</b> <span class="tag">'+esc(e.lex)+'</span>'+(e.root?'<span class="tag">جذر '+esc(e.root)+'</span>':'')+(e.pattern?'<span class="tag">'+esc(e.pattern)+'</span>':'')+
  e.senses.map(s=>'<div class="d">'+esc(s.d)+'</div>'+(s.rel?'<div class="rel">'+s.rel.map(x=>esc(x[0])+": "+esc(x[1])).join(" · ")+'</div>':'')+(s.ex?'<div class="rel">مثال: '+s.ex.map(esc).join(" / ")+'</div>':'')).join("")+'</div>').join("")+'</details>').join("");
};
</script></body></html>`;
