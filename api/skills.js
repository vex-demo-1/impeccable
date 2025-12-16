import { readdirSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, "..");

export default function handler(req, res) {
  try {
    const sourceDir = join(PROJECT_ROOT, "source");
    const skillsDir = join(sourceDir, "skills");

    const files = readdirSync(skillsDir);
    const skills = [];

    for (const file of files) {
      if (file.endsWith(".md")) {
        const content = readFileSync(join(skillsDir, file), "utf-8");
        const frontmatterMatch = content.match(/^---\n([\s\S]+?)\n---/);

        if (frontmatterMatch) {
          const frontmatter = frontmatterMatch[1];
          const nameMatch = frontmatter.match(/name:\s*(.+)/);
          const descMatch = frontmatter.match(/description:\s*(.+)/);

          skills.push({
            id: file.replace(".md", ""),
            name: nameMatch?.[1]?.trim() || file.replace(".md", ""),
            description: descMatch?.[1]?.trim() || "No description available",
          });
        }
      }
    }

    res.status(200).json(skills);
  } catch (error) {
    console.error("Error in /api/skills:", error);
    res.status(500).json({ error: error.message });
  }
}

