import { readFile } from 'node:fs/promises';
const read = async path => JSON.parse(await readFile(path, 'utf8'));
const manifest = await read('manifest.json');
const pkg = await read('package.json');
const versions = await read('versions.json');
const tag = process.env.GITHUB_REF_TYPE === 'tag' ? process.env.GITHUB_REF_NAME : process.argv[2];
if (!/^\d+\.\d+\.\d+$/.test(manifest.version) || pkg.version !== manifest.version || versions[manifest.version] !== manifest.minAppVersion) {
  throw new Error('package.json / manifest.json / versions.json are inconsistent');
}
if (tag && tag !== manifest.version) throw new Error(`Release tag must be ${manifest.version}, got ${tag}`);
console.log(`Release metadata valid: ${manifest.id} ${manifest.version}`);
