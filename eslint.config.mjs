import { defineConfig } from 'eslint/config';
import ts from 'typescript-eslint';
import obsidianmd from 'eslint-plugin-obsidianmd';
export default defineConfig([
  {
    files: ['src/**/*.ts'],
    extends: [...obsidianmd.configs.recommended],
    languageOptions: { parserOptions: { projectService: true } },
    rules: { '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }] },
  },
  { files: ['tests/**/*.ts'], extends: [...ts.configs.recommended] },
]);
