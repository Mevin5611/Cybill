import { config } from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

// Load both possible locations. Values already set are not overwritten.
const candidates = [
  path.resolve(here, '../.env'),      // server/.env
  path.resolve(here, '../../.env')    // project root .env
];

for (const file of candidates) {
  if (fs.existsSync(file)) {
    config({ path: file });
  }
}