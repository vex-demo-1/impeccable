import { join } from "path";

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    // Extract provider from path: /api/download/bundle/[provider]
    const provider = pathParts[3]; // after 'api', 'download', 'bundle'
    
    const distDir = join(process.cwd(), "dist");
    const zipPath = join(distDir, `${provider}.zip`);
    
    try {
      const file = Bun.file(zipPath);
      const exists = await file.exists();
      
      if (!exists) {
        return new Response("Bundle not found", { status: 404 });
      }
      
      return new Response(file, {
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="impeccable-style-${provider}.zip"`,
        },
      });
    } catch (error) {
      console.error("Error downloading bundle:", error);
      return new Response("Error downloading bundle", { status: 500 });
    }
  },
};

