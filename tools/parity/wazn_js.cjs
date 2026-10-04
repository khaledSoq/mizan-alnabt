// يطبع وزن كل كلمة من stdin بمحرك الموقع، سطرًا JSON لكل كلمة
const fs = require("fs"), vm = require("vm"), path = require("path");
const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.resolve(__dirname, "../../docs/engine.js"), "utf8") + "\nthis.Arud = Arud;", ctx);
for (const w of fs.readFileSync(0, "utf8").split("\n").filter(Boolean)) console.log(JSON.stringify([w, ctx.Arud.wordWazn(w)]));
