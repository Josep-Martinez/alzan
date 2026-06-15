#!/usr/bin/env node
// scripts/guard-cloud.js
// Safety gate for the cloud start commands (start:*:cloud).
//
// Two checks must pass before pointing the app at the cloud Supabase project:
//   1. The current git branch must be `main`. Running against cloud from a
//      feature branch / open PR is forbidden because the PR's migrations are
//      NOT applied to the cloud database yet — the schema would be out of sync.
//   2. .env.cloud must exist and have every value filled in (no placeholders
//      and no empty values).
//
// Usage: node scripts/guard-cloud.js  (run automatically by prestart:cloud)

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const REQUIRED_BRANCH = "main";
const cloudEnvPath = path.join(ROOT, ".env.cloud");

function fail(message) {
  console.error(`\n❌  ${message}\n`);
  process.exit(1);
}

// ─── 1) Branch must be main ───────────────────────────────────────────────────
let branch;
try {
  branch = execSync("git rev-parse --abbrev-ref HEAD", { cwd: ROOT })
    .toString()
    .trim();
} catch {
  fail("No se pudo determinar la rama de git (¿estás dentro del repo?).");
}

if (branch !== REQUIRED_BRANCH) {
  fail(
    `El arranque cloud solo está permitido en la rama "${REQUIRED_BRANCH}" — estás en "${branch}".\n` +
      `   Las migraciones de un PR abierto todavía NO están aplicadas en la Supabase de la nube,\n` +
      `   así que apuntar la app a cloud desde un PR rompería el esquema.\n` +
      `   Mergea/cierra el PR, cambia a "${REQUIRED_BRANCH}" y vuelve a intentarlo.`,
  );
}

// ─── 2) .env.cloud must exist and be fully filled ─────────────────────────────
if (!fs.existsSync(cloudEnvPath)) {
  fail(
    `Falta .env.cloud en la raíz.\n` +
      `   Copia .env.cloud.example a .env.cloud y pega las credenciales de la Supabase de la nube.`,
  );
}

const raw = fs.readFileSync(cloudEnvPath, "utf8");
// Flag any KEY= line whose value is empty or still a __PLACEHOLDER__.
const unfilled = [...raw.matchAll(/^\s*([A-Z0-9_]+)\s*=\s*(__.*__|)\s*$/gm)].map(
  (match) => match[1],
);

if (unfilled.length) {
  fail(
    `.env.cloud tiene valores sin rellenar: ${unfilled.join(", ")}.\n` +
      `   Pega las credenciales reales de la Supabase de la nube antes de arrancar.`,
  );
}

// ─── 3) Nada puede tapar el alzan-fe/.env generado ────────────────────────────
// Expo carga .env.local / .env.<NODE_ENV>[.local] con MÁS prioridad que .env, así
// que un override ahí mandaría la app a la Supabase equivocada (p.ej. la local)
// ignorando lo que env:sync:cloud escribe. Lo bloqueamos.
const feDir = path.join(ROOT, "alzan-fe");
const shadows = fs
  .readdirSync(feDir)
  .filter((f) => f.startsWith(".env.") && f !== ".env" && !f.includes("example"))
  .filter((f) => {
    try {
      return /^\s*EXPO_PUBLIC_SUPABASE_URL\s*=/m.test(
        fs.readFileSync(path.join(feDir, f), "utf8"),
      );
    } catch {
      return false;
    }
  });

if (shadows.length) {
  fail(
    `Hay ficheros .env en alzan-fe que TAPAN al generado y mandan la app a la Supabase equivocada:\n` +
      shadows.map((f) => `     - alzan-fe/${f}`).join("\n") +
      `\n   Expo prioriza .env.local / .env.<env> sobre .env. env:sync gestiona alzan-fe/.env,\n` +
      `   así que estos sobran — bórralos:\n` +
      shadows.map((f) => `     rm alzan-fe/${f}`).join("\n"),
  );
}

console.log(
  `✅  Rama "${branch}", .env.cloud y alzan-fe/.env verificados — arrancando contra Supabase cloud.`,
);
