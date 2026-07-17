// Pre-downloads msedgedriver and caches its path for nightwatch.conf.js to
// read synchronously. Needed because edgedriver's own install-time
// auto-trigger checks for a `/`-only path suffix, which never matches on
// Windows (`\dist\install.js`), so it silently no-ops there.
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { download } from 'edgedriver';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cacheFile = path.join(__dirname, '..', '.edgedriver-path.json');

try {
  const driverPath = await download();
  await writeFile(cacheFile, JSON.stringify({ path: driverPath }));
  console.log(`edgedriver ready at ${driverPath}`);
} catch (err) {
  // Non-fatal: Edge may not be installed on this machine — the Chrome
  // environment (npm test -- --env chrome) still works if Chrome is present.
  console.warn(`Could not set up edgedriver (${err.message}). "npm test" (Edge) will not work; use "npm test -- --env chrome" instead if Chrome is installed.`);
}
