import policy from '../../compatibility.json';

export { policy as THEME_COMPATIBILITY };
export interface InstalledTheme { name: string; version: string }
export type ThemeStatus = 'other-theme' | 'missing-api' | 'unsupported-api' | 'too-old' | 'invalid-version' | 'stale-css' | 'compatible' | 'unverified';
export interface ThemeCompatibility {
  status: ThemeStatus;
  compatible: boolean;
  version: string | null;
  api: number | null;
}
const installedThemes = new WeakMap<Document, InstalledTheme | null>();

export function setInstalledTheme(doc: Document, theme: InstalledTheme | null): void {
  installedThemes.set(doc, theme);
}
export function parseVersion(value: string): number[] | null {
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(value)) return null;
  const parts = value.split('.').map(Number);
  return parts.every(Number.isSafeInteger) ? parts : null;
}
export function compareVersions(a: string, b: string): number {
  const left = parseVersion(a), right = parseVersion(b);
  if (!left || !right) throw new Error('Expected stable x.y.z versions');
  for (let i = 0; i < 3; i++) {
    const difference = left[i]! - right[i]!;
    if (difference) return Math.sign(difference);
  }
  return 0;
}
export function inspectTheme(doc: Document): ThemeCompatibility {
  const style = doc.defaultView?.getComputedStyle(doc.body);
  const rawApi = style?.getPropertyValue('--litos-companion-api').trim() ?? '';
  const rawVersion = (style?.getPropertyValue('--litos-theme-version').trim() ?? '').replace(/^(["'])(.*)\1$/, '$2');
  const installed = installedThemes.get(doc);
  const manifestVersion = installed?.name === policy.themeName && parseVersion(installed.version) ? installed.version : null;
  const version = rawVersion || manifestVersion;
  const api = /^[1-9]\d*$/.test(rawApi) && Number.isSafeInteger(Number(rawApi)) ? Number(rawApi) : null;
  const result = (status: ThemeStatus): ThemeCompatibility => ({
    status, compatible: status === 'compatible' || status === 'unverified', version, api,
  });
  if (!rawApi) return result(installed?.name === policy.themeName || rawVersion ? 'missing-api' : 'other-theme');
  if (api === null || !policy.supportedThemeApis.includes(api)) return result('unsupported-api');
  if (version && !parseVersion(version)) return result('invalid-version');
  if (rawVersion && manifestVersion && rawVersion !== manifestVersion) return result('stale-css');
  if (version && compareVersions(version, policy.minimumThemeVersion) < 0) return result('too-old');
  return result(version ? 'compatible' : 'unverified');
}
export function describeThemeCompatibility(doc: Document): string {
  const state = inspectTheme(doc);
  const detected = `Litos ${state.version ?? '版本未知'}，接口 ${state.api ?? '未知'}`;
  switch (state.status) {
    case 'compatible': return `${detected}：兼容。标题控制和图表样式跟随主题。`;
    case 'unverified': return `${detected}：按接口兼容，无法确认主题版本。图表缺失的样式变量使用默认值。`;
    case 'other-theme': return '当前主题未提供 Litos 配套接口。通用图表增强和专注模式仍可使用。';
    case 'missing-api': return `${detected}：缺少配套接口，请更新或重新加载主题。`;
    case 'unsupported-api': return `${detected}：当前插件支持接口 ${policy.supportedThemeApis.join('、')}，请更新插件或使用兼容主题。`;
    case 'too-old': return `${detected}：需要 Litos ${policy.minimumThemeVersion} 或更新版本。`;
    case 'invalid-version': return `${detected}：主题版本声明无效，请检查主题安装。`;
    case 'stale-css': return `${detected}：已加载的样式与安装版本不一致，请重新加载主题。`;
  }
}
