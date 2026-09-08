#!/usr/bin/env python3
"""ابنِ docs/index.html ملفًا واحدًا مكتفيًا: المحرك مضمّن، الأزرار ثابتة."""

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENGINE = (ROOT / "docs" / "engine.js").read_text(encoding="utf-8")
ENGINE = ENGINE.replace("</script", "<\\/script")

HTML = r"""<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/>
<title>ميزان النبط</title>
<meta name="description" content="وزن الشعر النبطي من غير تشكيل"/>
<meta name="theme-color" content="#12100e"/>
<meta name="color-scheme" content="dark"/>
<meta name="referrer" content="no-referrer"/>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' rx='12' fill='%23f3ead8'/><text x='32' y='44' text-anchor='middle' font-size='36' fill='%231c1612'>م</text></svg>"/>
<style>
:root {
  --bg:#12100e; --elev:#1a1714; --surf:#211d18; --paper:#f3ead8; --edge:#e4d7c0;
  --ink:#1c1612; --soft:#3a322b; --fg:#f4efe6; --muted:#9a9186; --subtle:#6e675f;
  --ok:#6b7f63; --okfg:#ecf3e8; --brk:#9a5347; --brkfg:#f8e8e4;
  --one:#3f5c4a; --zero:#7a4a42; --bd:#3a342d; --ring:#8a9a7b;
  --sans: "Noto Naskh Arabic","Segoe UI",Tahoma,Arial,sans-serif;
  --disp: "Amiri","Traditional Arabic","Noto Naskh Arabic",serif;
}
* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
html, body { margin:0; min-height:100%; background:var(--bg); color:var(--fg); }
body { font-family:var(--sans); text-align:right; padding: env(safe-area-inset-top) 0 env(safe-area-inset-bottom); }
button { font-family:inherit; appearance:none; -webkit-appearance:none; cursor:pointer; }
.wrap { max-width:44rem; margin:0 auto; padding:0.85rem 0.85rem 2.5rem; }
.kicker { margin:0; font-size:0.72rem; color:var(--muted); }
h1 { margin:0.1rem 0 0; font-family:var(--disp); font-size:1.85rem; line-height:1.25; }
.lede { margin:0.35rem 0 0.8rem; font-size:0.82rem; line-height:1.7; color:var(--muted); }
.panel { background:var(--surf); border:1px solid var(--bd); border-radius:0.85rem; padding:0.85rem; }
label { display:block; margin:0 0 0.35rem; font-size:0.85rem; font-weight:700; }
textarea {
  width:100%; min-height:3.4rem; resize:vertical; border:1px solid var(--bd);
  border-radius:0.55rem; background:var(--elev); color:var(--fg);
  font-family:var(--disp); font-size:1.25rem; line-height:1.9;
  padding:0.55rem 0.8rem; outline:none;
}
textarea:focus { border-color:var(--ring); }
textarea::placeholder { color:var(--subtle); opacity:1; }
textarea::-webkit-input-placeholder { color:var(--subtle); }
.fields { display:flex; flex-direction:column; gap:0.65rem; }
.meters { display:flex; flex-wrap:wrap; gap:0.4rem; margin:0.2rem 0 0.15rem; }
.mchip {
  border:1px solid var(--bd); background:var(--elev); color:var(--fg);
  border-radius:999px; padding:0.45rem 0.8rem; font-size:0.82rem; min-height:2.4rem;
}
.mchip.on { background:var(--paper); color:var(--ink); border-color:var(--paper); font-weight:700; }
.actions { display:flex; gap:0.5rem; margin-top:0.75rem; }
.btn {
  flex:1; min-height:3rem; border:0; border-radius:0.55rem;
  font-size:1.05rem; font-weight:800;
}
.btn-go { background:var(--paper); color:var(--ink); }
.btn-go:active { filter:brightness(0.92); }
.btn-reset { background:var(--elev); color:var(--fg); border:1px solid var(--bd); flex:0 0 auto; padding:0 0.95rem; font-weight:600; font-size:0.88rem; }
.hint { margin:0.55rem 0 0; font-size:0.72rem; color:var(--subtle); line-height:1.55; }
.err { margin-top:0.75rem; padding:0.8rem; background:#3a1f1c; color:#f3d0c8; border-radius:0.55rem; font-size:0.85rem; }
.results { display:flex; flex-direction:column; gap:0.75rem; margin-top:0.85rem; min-height:2rem; }
.paper { background:var(--paper); color:var(--ink); border-radius:0.85rem; overflow:hidden; }
.phd { display:flex; flex-wrap:wrap; justify-content:space-between; gap:0.5rem; padding:0.65rem 0.9rem; border-bottom:1px solid var(--edge); align-items:center; }
.lbl { font-size:0.72rem; color:var(--soft); }
.mname { font-family:var(--disp); font-size:1.2rem; font-weight:700; }
.pill { border-radius:999px; padding:0.22rem 0.65rem; font-size:0.75rem; font-weight:700; }
.ok { background:var(--ok); color:var(--okfg); }
.bad { background:var(--brk); color:var(--brkfg); }
.dim { background:#ddd2be; color:var(--soft); }
.letters { padding:0.85rem 0.7rem 0.45rem; }
.words { display:flex; flex-wrap:wrap; gap:0.7rem 0.9rem; }
.word { display:flex; gap:0.1rem; }
.tile {
  min-width:2.25rem; min-height:3.2rem; padding:0.2rem 0.15rem 0.25rem;
  border:0; background:transparent; border-radius:0.35rem; color:var(--ink);
}
.tile:active { background:#e7dcc6; }
.glyph { display:block; font-family:var(--disp); font-size:1.55rem; line-height:1; }
.bit { display:block; margin-top:0.15rem; font-size:0.75rem; font-weight:700; }
.one { color:var(--one); }
.zero { color:var(--zero); }
.la { margin:0.35rem 0.9rem 0; font-family:var(--disp); font-size:1.15rem; color:var(--soft); }
.recite { margin:0.55rem 0.9rem 0; }
.recite b { display:block; font-size:0.72rem; font-weight:700; color:var(--soft); margin-bottom:0.15rem; }
.recite p { margin:0; font-family:var(--disp); font-size:1.2rem; line-height:1.9; }
.bits { margin:0.1rem 0.9rem 0.65rem; font-family:ui-monospace,monospace; font-size:0.7rem; letter-spacing:.12em; color:var(--subtle); direction:ltr; text-align:left; }
.boxes { display:grid; grid-template-columns:1fr 1fr; gap:0.4rem; padding:0.7rem; border-top:1px solid var(--edge); }
@media (min-width:640px) { .boxes { grid-template-columns:repeat(4,1fr); } }
.box { background:#efe6d3; border:1px solid var(--edge); border-radius:0.5rem; padding:0.55rem; }
.box.broken { background:#f3ddd6; border-color:var(--brk); }
.bn { font-family:var(--disp); font-weight:700; }
.bz { font-size:0.7rem; color:var(--soft); }
.ln { display:flex; flex-wrap:wrap; gap:0.2rem; margin-top:0.35rem; }
.ln i { font-style:normal; border-radius:0.25rem; padding:0.05rem 0.4rem; font-size:0.72rem; font-weight:700; }
.naam { background:var(--one); color:var(--okfg); }
.laa { background:#2a241f; color:var(--paper); }
.broke { margin:0.35rem 0 0; font-size:0.72rem; font-weight:700; color:var(--brk); }
.alts { padding:0.65rem 0.9rem; border-top:1px solid var(--edge); font-size:0.82rem; }
.alts b { display:block; font-size:0.72rem; color:var(--soft); margin-bottom:0.3rem; }
.fasih { margin:0; padding:0.45rem 0.9rem; border-top:1px solid var(--edge); font-size:0.72rem; color:var(--subtle); }
.ex { margin-top:1rem; }
.ex h2 { margin:0 0 0.45rem; font-size:0.8rem; color:var(--muted); font-weight:700; }
.exrow { display:flex; flex-direction:column; gap:0.45rem; }
.exb {
  border:1px solid var(--bd); background:var(--surf); color:var(--fg);
  border-radius:0.5rem; padding:0.65rem 0.8rem; font-size:0.92rem; text-align:right;
  width:100%; white-space:normal; overflow:visible;
}
.exb .mlabel { display:block; font-weight:700; font-size:0.82rem; margin-bottom:0.2rem; }
.exb .sadr, .exb .ajz {
  display:block; font-family:var(--disp); font-size:1.05rem; line-height:1.75;
  color:var(--muted); white-space:normal; overflow:visible; word-break:break-word;
}
.warn { text-align:center; color:var(--muted); font-size:0.82rem; }
footer { margin-top:1.2rem; text-align:center; font-size:0.72rem; color:var(--subtle); line-height:1.7; }
footer a { color:var(--muted); }
noscript { display:block; margin:0.8rem; padding:1rem; background:#3a1f1c; color:#f3d0c8; border-radius:0.5rem; }
</style>
</head>
<body>
<noscript>فعّل جافاسكربت حتى يشتغل الميزان.</noscript>
<div class="wrap">
  <header>
    <p class="kicker">شعر نبطي · من غير تشكيل</p>
    <h1>ميزان النبط</h1>
    <p class="lede">اكتب الصدر، وإن أحببت العجز. بلا حركات. اضغط الحرف: حركة ثم سكون ثم شدة.</p>
  </header>

  <section class="panel">
    <div class="fields">
      <div>
        <label for="sadr">الصدر</label>
        <textarea id="sadr" rows="2" placeholder="يا ما حلا الفنجال مع سيحة البال"></textarea>
      </div>
      <div>
        <label for="ajz">العجز</label>
        <textarea id="ajz" rows="2" placeholder="في مجلس ما فيه نفس ثقيلة"></textarea>
      </div>
    </div>

    <label style="margin-top:.75rem">البحر</label>
    <div class="meters" id="meters">
      <button type="button" class="mchip on" data-id="auto">تلقائي</button>
      <button type="button" class="mchip" data-id="mashub">المسحوب</button>
      <button type="button" class="mchip" data-id="arda">العرضة</button>
      <button type="button" class="mchip" data-id="hajini_tamm">الهجيني التام</button>
      <button type="button" class="mchip" data-id="hajini_qasir">الهجيني القصير</button>
      <button type="button" class="mchip" data-id="hilali">الهلالي</button>
      <button type="button" class="mchip" data-id="sakhri">الصخري</button>
      <button type="button" class="mchip" data-id="hida">الحداء</button>
      <button type="button" class="mchip" data-id="madid">المديد</button>
      <button type="button" class="mchip" data-id="mumtadd">الممتد</button>
    </div>

    <div class="actions">
      <button type="button" class="btn btn-go" id="go">زِن البيت</button>
      <button type="button" class="btn btn-reset" id="reset">صفّر القلب</button>
    </div>
    <p class="hint" id="hint">يمسح البيت ويعيد المثال الرمادي. اكتب فوقه مباشرة. 1 متحرك · 0 ساكن · لا = 10 · نعم = 110.</p>
  </section>

  <div id="boot" class="err" style="display:none"></div>
  <section class="results" id="results"></section>
  <p class="warn" id="same" style="display:none"></p>

  <section class="ex">
    <h2>أمثلة — اضغط للتجربة</h2>
    <div class="exrow" id="ex"></div>
  </section>

  <footer>
    القياس على النطق النجدي لا الرسم. الله سببان لا وتد. ال الشمسية تُدغم.
    <br/><a href="https://github.com/khaledSoq/mizan-alnabt">المصدر</a>
  </footer>
</div>

<script>
__ENGINE__
if (typeof window !== "undefined") { window.Arud = Arud; window.mizanReady = true; }
</script>
<script>
(function () {
  function fail(msg) {
    var boot = document.getElementById("boot");
    boot.style.display = "block";
    boot.textContent = msg;
  }
  function esc(s) {
    s = String(s == null ? "" : s);
    return s.split("&").join("&" + "amp;")
      .split("<").join("&" + "lt;")
      .split(">").join("&" + "gt;")
      .split('"').join("&" + "quot;");
  }
  var ArudRef = window.Arud;
  if (!ArudRef || typeof ArudRef.weigh !== "function") {
    fail("المحرك ما تحمّل. افتح الصفحة في كروم أو حدّث التطبيق.");
    return;
  }

  var METER_EXAMPLES = {
    mashub: { sadr: "يا ما حلا الفنجال مع سيحة البال", ajz: "في مجلس ما فيه نفس ثقيلة" },
    arda: { sadr: "نحمد الله جت على ما تمنى", ajz: "من ولي العرش جزل الوهايب" },
    hajini_tamm: { sadr: "غريب الدار ومناي التسلي", ajz: "أسلي خاطري عن حب خلي" },
    hajini_qasir: { sadr: "إن كان هذا جزانا", ajz: "الله يجازي الحبيب" },
    hilali: { sadr: "على ما يفوت القلب لا تشمت العدا", ajz: "ولا تشمت اللي ما درى بالذي جرى" },
    sakhri: { sadr: "ثلاث سنين ودموعي حيارى", ajz: "متى يا ناس في خدي تبارا" },
    hida: { sadr: "الزين بينة رسومه يا علي", ajz: "وان القمر غير النجوم اللي معه" },
    madid: { sadr: "السلام ولا سهى القلب عن ذكر الاله", ajz: "ربنا اللي نزل اقرا وعلم بالقلم" }
  };
  var EXAMPLES = [
    { meter: "mashub", label: "المسحوب", sadr: METER_EXAMPLES.mashub.sadr, ajz: METER_EXAMPLES.mashub.ajz },
    { meter: "mashub", label: "المسحوب — عابرة سبيل", sadr: "العيد باكر أسعد الله ممساك", ajz: "والله مادري وين حدٍ جلسته" },
    { meter: "arda", label: "العرضة", sadr: METER_EXAMPLES.arda.sadr, ajz: METER_EXAMPLES.arda.ajz },
    { meter: "hajini_tamm", label: "الهجيني التام", sadr: METER_EXAMPLES.hajini_tamm.sadr, ajz: METER_EXAMPLES.hajini_tamm.ajz },
    { meter: "hajini_qasir", label: "الهجيني القصير", sadr: METER_EXAMPLES.hajini_qasir.sadr, ajz: METER_EXAMPLES.hajini_qasir.ajz },
    { meter: "hilali", label: "الهلالي", sadr: METER_EXAMPLES.hilali.sadr, ajz: METER_EXAMPLES.hilali.ajz },
    { meter: "sakhri", label: "الصخري", sadr: METER_EXAMPLES.sakhri.sadr, ajz: METER_EXAMPLES.sakhri.ajz },
    { meter: "hida", label: "الحداء", sadr: METER_EXAMPLES.hida.sadr, ajz: METER_EXAMPLES.hida.ajz },
    { meter: "madid", label: "المديد", sadr: METER_EXAMPLES.madid.sadr, ajz: METER_EXAMPLES.madid.ajz }
  ];
  var LABELS = ["الصدر", "العجز", "شطر ثالث", "شطر رابع"];
  var sadrEl = document.getElementById("sadr");
  var ajzEl = document.getElementById("ajz");
  var metersEl = document.getElementById("meters");
  var resultsEl = document.getElementById("results");
  var sameEl = document.getElementById("same");
  var hintEl = document.getElementById("hint");
  var exEl = document.getElementById("ex");
  var meterId = "mashub";
  var hintMeter = "mashub";
  var locks = [];

  function applyPlaceholders(id) {
    var ex = METER_EXAMPLES[id];
    if (ex) {
      sadrEl.placeholder = ex.sadr;
      ajzEl.placeholder = ex.ajz;
    } else {
      sadrEl.placeholder = "الصدر، بلا حركات";
      ajzEl.placeholder = "العجز، بلا حركات — اتركه فارغاً لوزن الصدر وحده";
    }
  }
  function verseText() {
    var s = (sadrEl.value || "").replace(/^\s+|\s+$/g, "");
    var a = (ajzEl.value || "").replace(/^\s+|\s+$/g, "");
    if (!s && !a) {
      var ex = METER_EXAMPLES[hintMeter];
      if (ex) return ex.sadr + "\n" + ex.ajz;
    }
    return sadrEl.value + "\n" + ajzEl.value;
  }

  function setMeter(id) {
    meterId = id;
    var kids = metersEl.children;
    for (var i = 0; i < kids.length; i++) {
      var on = kids[i].getAttribute("data-id") === meterId;
      kids[i].className = on ? "mchip on" : "mchip";
    }
  }
  setMeter("mashub");
  applyPlaceholders("mashub");

  metersEl.onclick = function (ev) {
    var t = ev.target;
    while (t && t !== metersEl && !t.getAttribute("data-id")) t = t.parentNode;
    if (!t || t === metersEl) return;
    var id = t.getAttribute("data-id");
    setMeter(id);
    if (id !== "auto") {
      hintMeter = id;
      applyPlaceholders(id);
      var ex = METER_EXAMPLES[id];
      if (ex) {
        sadrEl.value = ex.sadr;
        ajzEl.value = ex.ajz;
      } else {
        sadrEl.value = "";
        ajzEl.value = "";
      }
      locks = [];
    }
    doWeigh();
  };

  for (var e = 0; e < EXAMPLES.length; e++) {
    (function (ex) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "exb";
      var html = "<span class='mlabel'>" + esc(ex.label) + "</span>";
      html += "<span class='sadr'>" + esc(ex.sadr) + "</span>";
      if (ex.ajz) html += "<span class='ajz'>" + esc(ex.ajz) + "</span>";
      b.innerHTML = html;
      b.onclick = function () {
        sadrEl.value = ex.sadr;
        ajzEl.value = ex.ajz;
        locks = [];
        setMeter(ex.meter);
        hintMeter = ex.meter;
        applyPlaceholders(ex.meter);
        doWeigh();
      };
      exEl.appendChild(b);
    })(EXAMPLES[e]);
  }

  function groupLetters(letters) {
    var words = [], cur = [], wi = (letters[0] && letters[0].wordI) || 0;
    for (var i = 0; i < letters.length; i++) {
      var L = letters[i];
      if (L.wordI !== wi) {
        if (cur.length) words.push(cur);
        cur = [L];
        wi = L.wordI;
      } else cur.push(L);
    }
    if (cur.length) words.push(cur);
    return words;
  }
  function haraka(L) {
    if (L.skipped || L.bit === null || typeof L.bit === "undefined") return "";
    if (L.shadda) return "\u0651\u064e";
    if (L.bit === 1) return "\u064e";
    if (L.bit === 0) return "\u0652";
    return "";
  }
  function recitedLine(letters) {
    var words = groupLetters(letters);
    var out = [];
    for (var w = 0; w < words.length; w++) {
      var chunk = "";
      var word = words[w];
      for (var i = 0; i < word.length; i++) {
        if (word[i].skipped) continue;
        chunk += (word[i].char || "") + haraka(word[i]);
      }
      if (chunk) out.push(chunk);
    }
    return out.join(" ");
  }
  function offset(wi, li, words) {
    var n = 0;
    for (var i = 0; i < wi; i++) n += words[i].length;
    return n + li;
  }

  function hemistichHTML(h, label, hi) {
    var words = groupLetters(h.letters || []);
    var pillCls = !h.ok ? "dim" : h.accepted ? "ok" : "bad";
    var score = (typeof h.score === "number") ? " · " + Math.round(h.score * 100) + "٪" : "";
    var tiles = "";
    if (!h.letters || !h.letters.length) {
      tiles = "<p class='lede' style='color:var(--soft);margin:0'>" + esc(h.message) + "</p>";
    } else {
      tiles = "<div class='words'>";
      for (var wi = 0; wi < words.length; wi++) {
        tiles += "<div class='word'>";
        var word = words[wi];
        for (var li = 0; li < word.length; li++) {
          var L = word[li];
          var g = offset(wi, li, words);
          var sh = !!L.shadda;
          var bit = L.bit;
          var bcls = sh || bit === 1 ? "one" : bit === 0 ? "zero" : "";
          var bt = sh ? "01" : (bit === 1 || bit === 0 ? bit : "—");
          var glyph = esc(L.char) + haraka(L);
          tiles += "<button type='button' class='tile' title='اضغط: حركة ثم سكون ثم شدة' data-hi='" + hi + "' data-li='" + g + "' data-bit='" + bit + "' data-sh='" + (sh ? "1" : "0") + "'>" +
            "<span class='glyph'>" + glyph + "</span>" +
            "<span class='bit " + bcls + "'>" + bt + "</span></button>";
        }
        tiles += "</div>";
      }
      tiles += "</div>";
    }
    var recited = "";
    if (h.letters && h.letters.length) {
      var rec = recitedLine(h.letters);
      if (rec) {
        recited = "<div class='recite'><b>النطق المستنتج</b><p>" + esc(rec) + "</p></div>";
      }
    }
    var la = "";
    if (h.ok && h.laNaam && h.laNaam.length) {
      la = "<p class='la'>" + h.laNaam.map(esc).join(" · ") + "</p>";
    }
    var bits = (h.ok && h.bits) ? "<p class='bits' dir='ltr'>" + esc(h.bits) + "</p>" : "";
    var boxes = "";
    if (h.boxes && h.boxes.length) {
      boxes = "<div class='boxes'>";
      for (var bi = 0; bi < h.boxes.length; bi++) {
        var box = h.boxes[bi];
        boxes += "<div class='box" + (box.broken ? " broken" : "") + "'><div class='bn'>" + esc(box.name) +
          (box.zihaf ? " <span class='bz'>" + esc(box.zihaf) + "</span>" : "") + "</div><div class='ln'>";
        var lns = box.laNaam || [];
        for (var j = 0; j < lns.length; j++) {
          boxes += "<i class='" + (lns[j] === "نعم" ? "naam" : "laa") + "'>" + esc(lns[j]) + "</i>";
        }
        boxes += "</div>" + (box.broken ? "<p class='broke'>موضع الكسر</p>" : "") + "</div>";
      }
      boxes += "</div>";
    }
    var alts = "";
    if (h.alts && h.alts.length) {
      alts = "<div class='alts'><b>أوجه قريبة</b>";
      for (var ai = 0; ai < h.alts.length; ai++) {
        var a = h.alts[ai];
        alts += "<div>" + esc(a.meterName) + (a.note ? " — " + esc(a.note) : "") +
          " <span dir='ltr'>" + esc(a.bits) + "</span></div>";
      }
      alts += "</div>";
    }
    var fasih = (h.fasih && h.ok) ? "<p class='fasih'>مقابله في الفصيح: " + esc(h.fasih) + "</p>" : "";
    return "<article class='paper'><header class='phd'><div><span class='lbl'>" + esc(label) +
      "</span> " + (h.meterName ? "<span class='mname'>" + esc(h.meterName) + "</span>" : "") +
      "</div><span class='pill " + pillCls + "'>" + esc(h.message) + score + "</span></header>" +
      "<div class='letters'>" + tiles + recited + la + bits + "</div>" + boxes + alts + fasih + "</article>";
  }

  function doWeigh() {
    try {
      document.getElementById("boot").style.display = "none";
      var result = ArudRef.weigh(verseText(), meterId, locks);
      hintEl.textContent = (result.mode === "discover"
        ? "اكتشاف تلقائي لأقرب بحر. "
        : "فحص البحر المختار. ") + "يمسح تعديلك على الحروف. اضغط الحرف: حركة ثم سكون ثم شدة.";
      if (!result.hemistichs || !result.hemistichs.length) {
        resultsEl.innerHTML = "<div class='err' style='background:var(--surf);color:var(--muted)'>" + esc(result.message) + "</div>";
      } else {
        var html = "";
        for (var i = 0; i < result.hemistichs.length; i++) {
          var lab;
          if (result.hemistichs.length === 1) {
            lab = (sadrEl.value || "").replace(/^\s+|\s+$/g, "") ? "الصدر" : "العجز";
          } else {
            lab = LABELS[i] || ("شطر " + (i + 1));
          }
          html += hemistichHTML(result.hemistichs[i], lab, i);
        }
        resultsEl.innerHTML = html;
      }
      if (result.hemistichs && result.hemistichs.length === 2 && result.sameMeter === false) {
        sameEl.style.display = "block";
        sameEl.textContent = "الشطران على بحرين مختلفين. ثبّت بحراً واحداً للقصيدة.";
      } else {
        sameEl.style.display = "none";
      }
    } catch (err) {
      fail("خطأ أثناء الوزن: " + (err && err.message ? err.message : err));
    }
  }

  resultsEl.onclick = function (ev) {
    var btn = ev.target;
    while (btn && btn !== resultsEl && !(btn.getAttribute && btn.getAttribute("data-li") != null)) {
      btn = btn.parentNode;
    }
    if (!btn || btn === resultsEl) return;
    var hi = +btn.getAttribute("data-hi");
    var li = +btn.getAttribute("data-li");
    var sh = btn.getAttribute("data-sh") === "1";
    var raw = btn.getAttribute("data-bit");
    var next;
    if (sh) next = 1;
    else if (raw === "1") next = 0;
    else if (raw === "0") next = 2;
    else next = 1;
    while (locks.length <= hi) locks.push({});
    locks[hi][li] = next;
    doWeigh();
  };

  document.getElementById("go").onclick = function () {
    doWeigh();
    if (resultsEl.scrollIntoView) {
      try { resultsEl.scrollIntoView({ behavior: "smooth", block: "start" }); }
      catch (e) { resultsEl.scrollIntoView(); }
    }
  };
  document.getElementById("reset").onclick = function () {
    sadrEl.value = "";
    ajzEl.value = "";
    locks = [];
    doWeigh();
  };
  sadrEl.oninput = function () { locks = []; };
  ajzEl.oninput = function () { locks = []; };

  doWeigh();
})();
</script>
</body>
</html>
"""

out = HTML.replace("__ENGINE__", ENGINE)
path = ROOT / "docs" / "index.html"
path.write_text(out, encoding="utf-8")
print("wrote", path, "bytes", path.stat().st_size)
