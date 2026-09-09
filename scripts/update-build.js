const fs = require('fs');
const path = require('path');

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
