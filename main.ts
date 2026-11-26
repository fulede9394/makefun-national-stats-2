// NationScope hand-in.
//
// Copies the finished site (app/) and its screenshots (screenshots/) into the
// output directory and writes dossier.json there with the kit's dossier
// library. The grader runs this program twice and expects both runs to
// produce byte-identical output, so every step below is deterministic: files
// are copied as they are, and the dossier is built from those files alone.
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

// The folder this file lives in is the repository root.
const REPO_ROOT = dirname(fileURLToPath(import.meta.url));

// Where the finished entry goes. The grader sets MAKEFUN_OUTPUT_DIR; without
// it the program uses /output, the directory the rules name.
const OUTPUT_DIR = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? "/output");

// The scorer's caps for this bounty, straight from the kit's RULES.txt:
// the dossier text holds at most 160 KiB, screenshots/ at most 4 images of
// 256 KiB each, app/ at most 993 files and directories totalling 16 MiB.
const DOSSIER_LIMITS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 16777216,
};

// Which folders of the repository make up the entry.
const ENTRY_FOLDERS = ["app", "screenshots"] as const;

// Copy one repository folder into the output directory, replacing whatever
// an earlier run left there.
async function copyFolder(name: (typeof ENTRY_FOLDERS)[number]): Promise<void> {
  await cp(join(REPO_ROOT, name), join(OUTPUT_DIR, name), {
    recursive: true,
    force: true,
  });
}

// The site is not a site without its page: refuse loudly if the copy did not
// bring app/index.html along, instead of handing in a broken entry.
async function requireIndexPage(): Promise<void> {
  const page = join(OUTPUT_DIR, "app", "index.html");
  try {
    await readFile(page);
  } catch {
    throw new Error(`hand-in refused: ${page} is missing after copying app/`);
  }
}

// Read the dossier back and check it is real JSON with content: a hand-in
// that silently wrote an empty or broken dossier.json would fail the gate
// far from here, so catch it at the source instead.
async function verifyDossier(path: string): Promise<void> {
  const raw = await readFile(path, "utf8");
  if (raw.trim().length === 0) {
    throw new Error(`hand-in refused: ${path} is empty`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`hand-in refused: ${path} is not valid JSON`);
  }
  if (typeof parsed !== "object" || parsed === null || Object.keys(parsed).length === 0) {
    throw new Error(`hand-in refused: ${path} holds no dossier object`);
  }
}

async function handIn(): Promise<void> {
  await mkdir(OUTPUT_DIR, { recursive: true });
  for (const folder of ENTRY_FOLDERS) await copyFolder(folder);
  await requireIndexPage();

  const dossier = buildDossier(OUTPUT_DIR, DOSSIER_LIMITS);
  const dossierPath = join(OUTPUT_DIR, "dossier.json");
  await writeFile(dossierPath, dossier);
  await verifyDossier(dossierPath);
  console.log(`NationScope handed in to ${OUTPUT_DIR}`);
}

handIn().catch((err: unknown) => {
  console.error(`hand-in failed: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
