import { readFile } from 'node:fs/promises';
const read = async path => JSON.parse(await readFile(path, 'utf8'));
const manifest = await read('manifest.json');
const pkg = await read('package.json');
const versions = await read('versions.json');
const lock = await read('package-lock.json');
const policy = await read('compatibility.json');
const tag = process.env.GITHUB_REF_TYPE === 'tag' ? process.env.GITHUB_REF_NAME : process.argv[2];
if (typeof manifest.description !== 'string' || !/[.!?]$/.test(manifest.description.trim())) {
  throw new Error('Plugin description must end with ., !, or ?');
}
if (!/^\d+\.\d+\.\d+$/.test(manifest.version) || pkg.version !== manifest.version || versions[manifest.version] !== manifest.minAppVersion
  || lock.version !== manifest.version || lock.packages[''].version !== manifest.version) {
  throw new Error('package.json / manifest.json / versions.json are inconsistent');
}
if (tag && tag !== manifest.version) throw new Error(`Release tag must be ${manifest.version}, got ${tag}`);
if (policy.schemaVersion !== 1 || policy.themeName !== 'Litos' || !/^\d+\.\d+\.\d+$/.test(policy.minimumThemeVersion)
  || !Array.isArray(policy.supportedThemeApis) || !policy.supportedThemeApis.length
  || !policy.supportedThemeApis.every(api => Number.isSafeInteger(api) && api > 0)) {
  throw new Error('Invalid theme compatibility policy');
}
console.log(`Release metadata valid: ${manifest.id} ${manifest.version}`);
