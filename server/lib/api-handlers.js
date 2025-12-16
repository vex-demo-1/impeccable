import { readdir, readFile } from "fs/promises";
import { basename, join } from "path";
import { existsSync } from "fs";

// Helper to read file content (works in both Node.js and Bun)
async function readFileContent(filePath) {
	return readFile(filePath, "utf-8");
}

// Read all skills from source directory
export async function getSkills() {
	const sourceDir = join(process.cwd(), "source");
	const skillsDir = join(sourceDir, "skills");
	const files = await readdir(skillsDir);
	const skills = [];

	for (const file of files) {
		if (file.endsWith(".md")) {
			const content = await readFileContent(join(skillsDir, file));
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

// Read all commands from source directory
export async function getCommands() {
	const sourceDir = join(process.cwd(), "source");
	const commandsDir = join(sourceDir, "commands");
	const files = await readdir(commandsDir);
	const commands = [];

	for (const file of files) {
		if (file.endsWith(".md")) {
			const content = await readFileContent(join(commandsDir, file));
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

// Get the appropriate file path for a provider
export function getFilePath(type, provider, id) {
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

// Handle individual file download
export async function handleFileDownload(type, provider, id) {
	if (type !== "skill" && type !== "command") {
		return new Response("Invalid type", { status: 400 });
	}

	const filePath = getFilePath(type, provider, id);

	if (!filePath) {
		return new Response("Invalid provider", { status: 400 });
	}

	try {
		if (!existsSync(filePath)) {
			return new Response("File not found", { status: 404 });
		}

		const content = await readFile(filePath);
		const fileName = basename(filePath);
		return new Response(content, {
			headers: {
				"Content-Type": "application/octet-stream",
				"Content-Disposition": `attachment; filename="${fileName}"`,
			},
		});
	} catch (error) {
		console.error("Error downloading file:", error);
		return new Response("Error downloading file", { status: 500 });
	}
}

// Read patterns from source/patterns.md
export async function getPatterns() {
	const sourceDir = join(process.cwd(), "source");
	const filePath = join(sourceDir, "patterns.md");

	try {
		const content = await readFileContent(filePath);
		const frontmatterMatch = content.match(/^---\n([\s\S]+?)\n---/);

		if (!frontmatterMatch) {
			return { patterns: [], antipatterns: [] };
		}

		const frontmatterText = frontmatterMatch[1];

		// Parse patterns and antipatterns from frontmatter
		const patterns = [];
		const antipatterns = [];
		const lines = frontmatterText.split('\n');
		let currentSection = null;
		let currentCategory = null;
		let inItems = false;

		for (const line of lines) {
			const trimmed = line.trim();
			if (!trimmed) continue;

			const indent = line.length - line.trimStart().length;

			// Top-level section declaration
			if (indent === 0 && trimmed === 'patterns:') {
				currentSection = 'patterns';
				currentCategory = null;
				inItems = false;
				continue;
			}
			if (indent === 0 && trimmed === 'antipatterns:') {
				currentSection = 'antipatterns';
				currentCategory = null;
				inItems = false;
				continue;
			}

			// New category starts with "- name:"
			if (trimmed.startsWith('- name:') && currentSection) {
				currentCategory = {
					name: trimmed.slice(7).trim(),
					items: []
				};
				if (currentSection === 'patterns') {
					patterns.push(currentCategory);
				} else {
					antipatterns.push(currentCategory);
				}
				inItems = false;
				continue;
			}

			// Items array declaration
			if (trimmed === 'items:' && currentCategory) {
				inItems = true;
				continue;
			}

			// Item within items array (indented with "- ")
			if (trimmed.startsWith('- ') && inItems && currentCategory && indent >= 6) {
				currentCategory.items.push(trimmed.slice(2).trim());
			}
		}

		return { patterns, antipatterns };
	} catch (error) {
		console.error("Error reading patterns:", error);
		return { patterns: [], antipatterns: [] };
	}
}

// Handle bundle download
export async function handleBundleDownload(provider) {
	const distDir = join(process.cwd(), "dist");
	const zipPath = join(distDir, `${provider}.zip`);

	try {
		if (!existsSync(zipPath)) {
			return new Response("Bundle not found", { status: 404 });
		}

		const content = await readFile(zipPath);
		return new Response(content, {
			headers: {
				"Content-Type": "application/zip",
				"Content-Disposition": `attachment; filename="impeccable-style-${provider}.zip"`,
			},
		});
	} catch (error) {
		console.error("Error downloading bundle:", error);
		return new Response("Error downloading bundle", { status: 500 });
	}
}
