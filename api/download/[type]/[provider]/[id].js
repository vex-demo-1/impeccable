import { join, basename } from "path";

// Get the appropriate file path for a provider
function getFilePath(type, provider, id) {
  const distDir = join(process.cwd(), "dist");
  
  if (type === "skill") {
    if (provider === "cursor") {
      return join(distDir, "cursor", ".cursor", "rules", `${id}.md`);
    } else if (provider === "claude-code") {
      return join(distDir, "claude-code", ".claude", "skills", id, "SKILL.md");
    } else if (provider === "gemini") {
      return join(distDir, "gemini", `GEMINI.${id}.md`);
    } else if (provider === "codex") {
      return join(distDir, "codex", `AGENTS.${id}.md`);
    }
  } else if (type === "command") {
    if (provider === "cursor") {
      return join(distDir, "cursor", ".cursor", "commands", `${id}.md`);
    } else if (provider === "claude-code") {
      return join(distDir, "claude-code", ".claude", "commands", `${id}.md`);
    } else if (provider === "gemini") {
      return join(distDir, "gemini", ".gemini", "commands", `${id}.toml`);
    } else if (provider === "codex") {
      return join(distDir, "codex", ".codex", "prompts", `${id}.md`);
    }
  }
  return null;
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    // Extract params from path: /api/download/[type]/[provider]/[id]
    const type = pathParts[2]; // after 'api', 'download'
    const provider = pathParts[3];
    const id = pathParts[4];
    
    if (type !== "skill" && type !== "command") {
      return new Response("Invalid type", { status: 400 });
    }
    
    const filePath = getFilePath(type, provider, id);
    
    if (!filePath) {
      return new Response("Invalid provider", { status: 400 });
    }
    
    try {
      const file = Bun.file(filePath);
      const exists = await file.exists();
      
      if (!exists) {
        return new Response("File not found", { status: 404 });
      }
      
      const fileName = basename(filePath);
      return new Response(file, {
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": `attachment; filename="${fileName}"`,
        },
      });
    } catch (error) {
      console.error("Error downloading file:", error);
      return new Response("Error downloading file", { status: 500 });
    }
  },
};

