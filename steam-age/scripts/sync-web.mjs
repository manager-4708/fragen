import { copyFileSync, cpSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const src = join(root, "steam-age/dist");
const dest = join(root, "web/steam-age");
const landingSrc = join(root, "web/templates/index.html");
const landingDest = join(root, "web/index.html");

rmSync(dest, { recursive: true, force: true });
mkdirSync(join(root, "web"), { recursive: true });
cpSync(src, dest, { recursive: true });
copyFileSync(landingSrc, landingDest);
console.log("Published static build to web/steam-age/ and web/index.html");
