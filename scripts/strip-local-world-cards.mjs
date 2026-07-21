#!/usr/bin/env node
// World cards are served from R2 by functions/worlds/cards/[[file]].js.
// Astro copies site/public/worlds/cards (local generation output) into the
// static build; this strips it so deploys stay light and the Function owns
// the route. Runs as part of `bun run build`.

import { rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const buildCards = join(dirname(fileURLToPath(import.meta.url)), '..', 'build', 'worlds', 'cards');
if (existsSync(buildCards)) {
  rmSync(buildCards, { recursive: true });
  console.log('✓ Stripped local world cards from build output (served from R2)');
}
