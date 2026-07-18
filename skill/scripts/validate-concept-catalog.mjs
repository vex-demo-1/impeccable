#!/usr/bin/env node

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readConceptCatalog, validateConceptCatalog } from './lib/concept-catalog.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const { catalog, reviewData } = readConceptCatalog(
  join(here, 'concept-ingredients.json'),
  join(here, 'concept-reviews.json')
);
const result = validateConceptCatalog(catalog, reviewData, { minimumTotal: 2304 });

if (result.errors.length > 0) {
  for (const error of result.errors) process.stderr.write(`concept-catalog: ${error}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    `concept-catalog: ${result.stats.concepts} concepts across ${result.stats.families} families; ` +
    `${result.stats.approved} approved, ${result.stats.pending} pending, ${result.stats.rejected} rejected\n`
  );
}
