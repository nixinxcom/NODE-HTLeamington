// scripts/dev-tenant.js
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const tenant = process.argv[2];
const port = process.argv[3] || "3000";
const modeArg = (process.argv[4] || "").toLowerCase();
const mode = modeArg === "start" ? "start" : "dev"; // dev por defecto

// ✅ Forzar un NODE_ENV válido para Next.js
if (mode === "start") {
  // next start -> producción
  process.env.NODE_ENV = "production";
} else {
  // next dev -> desarrollo
  process.env.NODE_ENV = "development";
}

if (!tenant) {
  console.error(
    'Falta argumento tenant.\n' +
      'Uso: node scripts/dev-tenant.js NIXINX 3001 [start]'
  );
  process.exit(1);
}

const envFile = `.env.${tenant}.local`;
const envPath = path.join(process.cwd(), envFile);

if (!fs.existsSync(envPath)) {
  console.error(`No existe ${envFile}`);
  process.exit(1);
}

// Cargar variables desde .env.<TENANT>.local en process.env (sin tocar .env.local)
const content = fs.readFileSync(envPath, "utf8");
for (const raw of content.split("\n")) {
  const line = raw.trim();
  if (!line || line.startsWith("#")) continue;

  const idx = line.indexOf("=");
  if (idx === -1) continue;

  const key = line.slice(0, idx).trim();
  let value = line.slice(idx + 1).trim();

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  if (key) process.env[key] = value;
}

// Marcar explícitamente el tenant en el entorno
process.env.NEXT_PUBLIC_TENANT = tenant;
process.env.TENANT = tenant;

console.log(
  `Using ${envFile} for tenant ${tenant} on port ${port} (mode: ${mode}, NODE_ENV=${process.env.NODE_ENV})`
);

// Resolver CLI de Next
let nextCli;
try {
  nextCli = require.resolve("next/dist/bin/next");
} catch (e) {
  console.error(
    'No se encontró "next/dist/bin/next". Asegúrate de haber corrido "npm install".'
  );
  process.exit(1);
}

// Ejecutar: next dev/start -p <port>
const child = spawn(process.execPath, [nextCli, mode, "-p", port], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
