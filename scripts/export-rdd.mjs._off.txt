import fs from "node:fs";
import path from "node:path";
import process from "node:process";

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {
    base:
      "http://localhost:3000",
    locales: ["es", "en", "fr"],
    outDir: "./public/out/rdd",
  };

  // primer pase para detectar --base
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--base") {
      out.base = args[i + 1];
      break;
    }
  }

  // si no vino --base, usamos envs
  if (!args.includes("--base")) {
    out.base =
      process.env.BASE_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      out.base;
  }

  // resto de flags
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--base") {
      // ya manejado arriba
      i++;
    } else if (a === "--locales") {
      out.locales = args[++i]
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (a === "--out") {
      out.outDir = args[++i];
    }
  }
  // normaliza base (sin slash final)
  out.base = String(out.base).replace(/\/$/, "");
  return out;
}

async function fetchJson(url) {
  const r = await fetch(url, { headers: { "cache-control": "no-cache" } });
  if (!r.ok) throw new Error(`${url} → HTTP ${r.status}`);
  return await r.json();
}

async function main() {
  const { base, locales, outDir } = parseArgs();
  const abs = path.resolve(outDir);
  fs.mkdirSync(abs, { recursive: true });

  // settings (single)
  const settingsUrl = `${base}/api/out/rdd/settings`;
  const settings = await fetchJson(settingsUrl);
  fs.writeFileSync(
    path.join(abs, `settings.json`),
    JSON.stringify(settings?.settings ?? settings, null, 2)
  );

  for (const loc of locales) {
    const dir = path.join(abs, loc);
    fs.mkdirSync(dir, { recursive: true });

    // branding
    const bUrl = `${base}/api/out/rdd/branding/${loc}`;
    const b = await fetchJson(bUrl);
    fs.writeFileSync(
      path.join(dir, `branding.json`),
      JSON.stringify(b?.branding ?? b, null, 2)
    );

    // i18n
    const iUrl = `${base}/api/out/rdd/i18n/${loc}`;
    const i = await fetchJson(iUrl);
    fs.writeFileSync(
      path.join(dir, `i18n.json`),
      JSON.stringify(i?.dict ?? i, null, 2)
    );
  }

  console.log(`✔ RDD exported from ${base} → ${abs}`);
}

main().catch((e) => {
  console.error("✖ export-rdd error:", e?.message || e);
  process.exit(1);
});
