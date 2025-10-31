// scripts/copy-css.js  (CommonJS)
const fs = require("fs");
const path = require("path");

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function copyModuleCSS(srcDir, relFrom = srcDir) {
  if (!fs.existsSync(srcDir)) return;
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(srcDir, e.name);
    if (e.isDirectory()) { copyModuleCSS(full, relFrom); continue; }
    if (e.isFile() && e.name.endsWith(".module.css")) {
      const rel = path.relative(relFrom, full);
      const dest = path.join("dist", relFrom, rel);
      ensureDir(path.dirname(dest));
      fs.copyFileSync(full, dest);
      console.log(`✅ Copiado módulo: ${full} → ${dest}`);
    }
  }
}

function copyGlobalsCSS() {
  const src = path.join("app", "globals.css");
  const dest = path.join("dist", "app", "globals.css");
  if (fs.existsSync(src)) {
    ensureDir(path.dirname(dest));
    fs.copyFileSync(src, dest);
    console.log(`✅ Copiado globals.css: ${src} → ${dest}`);
  } else {
    console.warn(`⚠️  globals.css no encontrado en ${src}`);
  }
}

if (fs.existsSync("complements")) copyModuleCSS("complements");
copyGlobalsCSS();
