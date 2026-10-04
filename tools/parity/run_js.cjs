// يزن أسطر الملف المعطى بمحرك الموقع (docs/engine.js) ويطبع JSON سطرًا لكل نتيجة
const fs = require("fs"), vm = require("vm"), path = require("path");
const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.resolve(__dirname, "../../docs/engine.js"), "utf8") + "\nthis.Arud = Arud;", ctx);
const lines = fs.readFileSync(process.argv[2], "utf8").split("\n").filter(Boolean);
for (const meter of ["auto", "mashub", "hajini_tamm"]) {
  for (const t of lines) {
    const r = ctx.Arud.weighHemistich(t, meter);
    console.log(JSON.stringify({ meter, t, bits: r.bits || "", id: r.meterId || "", score: Math.round((r.score || 0) * 1000) }));
  }
}
