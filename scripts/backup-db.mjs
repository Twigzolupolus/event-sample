import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const source = path.join(root, "prisma", "dev.db");
const backupDir = path.join(root, "backups");
await fs.mkdir(backupDir, { recursive: true });

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const target = path.join(backupDir, `dev-${stamp}.db`);

await fs.copyFile(source, target);
console.log(`Backup created: ${target}`);
