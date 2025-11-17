import { readdir } from "fs/promises";
import { join } from "path";

// Read all commands from source directory
async function getCommands() {
  const sourceDir = join(process.cwd(), "source");
  const commandsDir = join(sourceDir, "commands");
  const files = await readdir(commandsDir);
  const commands = [];

  for (const file of files) {
    if (file.endsWith(".md")) {
      const content = await Bun.file(join(commandsDir, file)).text();
      const frontmatterMatch = content.match(/^---\n([\s\S]+?)\n---/);
      
      if (frontmatterMatch) {
        const frontmatter = frontmatterMatch[1];
        const nameMatch = frontmatter.match(/name:\s*(.+)/);
        const descMatch = frontmatter.match(/description:\s*(.+)/);
        
        commands.push({
          id: file.replace(".md", ""),
          name: nameMatch?.[1]?.trim() || file.replace(".md", ""),
          description: descMatch?.[1]?.trim() || "No description available",
        });
      }
    }
  }

  return commands;
}

export default {
  async fetch(request) {
    const commands = await getCommands();
    return Response.json(commands);
  },
};

