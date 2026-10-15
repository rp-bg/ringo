import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const buildInfoPath = path.join(__dirname, '..', 'build-info.json');

let buildInfo = { buildNumber: 0, buildId: '0', updatedAt: '' };

if (fs.existsSync(buildInfoPath)) {
  try {
    buildInfo = JSON.parse(fs.readFileSync(buildInfoPath, 'utf8'));
  } catch {
    buildInfo = { buildNumber: 0, buildId: '0', updatedAt: '' };
  }
}

buildInfo.buildNumber = (Number(buildInfo.buildNumber) || 0) + 1;
buildInfo.buildId = String(buildInfo.buildNumber);
buildInfo.updatedAt = new Date().toISOString();

fs.writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2) + '\n');
console.log(`[Build Info] Updated build number to ${buildInfo.buildNumber}`);
