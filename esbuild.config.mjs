import * as esbuild from 'esbuild';
import { copyFile } from 'node:fs/promises';
const watch = process.argv.includes('--watch');
const options = {
  entryPoints: ['src/main.ts'], bundle: true, format: 'cjs', target: 'es2021',
  outfile: 'main.js', external: ['obsidian', 'electron', '@codemirror/view', '@codemirror/state'],
  sourcemap: watch ? 'inline' : false, minify: !watch,
  logLevel: 'info', legalComments: 'inline',
  plugins: [{ name: 'styles', setup(build) {
    build.onEnd(async () => { await copyFile('styles/plugin.css', 'styles.css'); });
  }}]
};
if (watch) { const context = await esbuild.context(options); await context.watch(); }
else await esbuild.build(options);
