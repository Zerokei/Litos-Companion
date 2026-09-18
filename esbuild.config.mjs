import * as esbuild from 'esbuild';
import { copyFile, readFile } from 'node:fs/promises';
const watch = process.argv.includes('--watch');
// Obsidian downloads only the standard plugin assets. Keep full notices inside
// main.js so they also accompany installations made from the release.
const notices = await Promise.all(['LICENSE', 'docs/third-party-notices.txt'].map(path => readFile(path, 'utf8')));
const options = {
  entryPoints: ['src/main.ts'], bundle: true, format: 'cjs', target: 'es2021',
  outfile: 'main.js', external: ['obsidian', 'electron', '@codemirror/view', '@codemirror/state'],
  sourcemap: watch ? 'inline' : false, minify: !watch,
  logLevel: 'info', legalComments: 'inline',
  banner: { js: `/*!\n${notices.join('\n\n').replace(/\*\//g, '* /')}\n*/` },
  plugins: [{ name: 'styles', setup(build) {
    build.onEnd(async () => { await copyFile('styles/plugin.css', 'styles.css'); });
  }}]
};
if (watch) { const context = await esbuild.context(options); await context.watch(); }
else await esbuild.build(options);
