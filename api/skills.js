import { readdir } from "fs/promises";
import { join } from "path";

// Read all skills from source directory
async function getSkills() {
  const sourceDir = join(process.cwd(), "source");
  const skillsDir = join(sourceDir, "skills");
  const files = await readdir(skillsDir);
  const skills = [];

  for (const file of files) {
    if (file.endsWith(".md")) {
      const content = await Bun.file(join(skillsDir, file)).text();
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

  return skills;
}

export default {
  async fetch(request) {
    const skills = await getSkills();
    return Response.json(skills);
  },
};

