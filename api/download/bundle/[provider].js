import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, "../../..");

export default function handler(req, res) {
  try {
    const { provider } = req.query;
    const distDir = join(PROJECT_ROOT, "dist");
    const zipPath = join(distDir, `${provider}.zip`);

    if (!existsSync(zipPath)) {
      return res.status(404).json({ error: "Bundle not found" });
    }

    const content = readFileSync(zipPath);
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="impeccable-style-${provider}.zip"`);
    res.send(content);
  } catch (error) {
    console.error("Error downloading bundle:", error);
    res.status(500).json({ error: error.message });
  }
}

