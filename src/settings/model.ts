export interface CompanionSettings {
  version: 1;
  headingAlignment: 'left' | 'right';
  diagramsEnabled: boolean;
}
export const DEFAULT_SETTINGS: CompanionSettings = {
  version: 1, headingAlignment: 'right', diagramsEnabled: false,
};
export function normalizeSettings(value: unknown): CompanionSettings {
  const saved = value !== null && typeof value === 'object' ? value as Record<string, unknown> : {};
  return {
    version: 1,
    headingAlignment: saved.headingAlignment === 'left' ? 'left' : 'right',
    diagramsEnabled: saved.diagramsEnabled === true,
  };
}

/** Writes are serialized so an older save cannot overwrite a newer selection. */
export class SettingsStore {
  value: CompanionSettings;
  private writes = Promise.resolve();
  constructor(saved: unknown, private readonly persist: (value: CompanionSettings) => Promise<void>) {
    this.value = normalizeSettings(saved);
  }
  update(patch: Partial<Omit<CompanionSettings, 'version'>>): Promise<void> {
    this.value = normalizeSettings({ ...this.value, ...patch });
    const snapshot = { ...this.value };
    const write = this.writes.then(() => this.persist(snapshot));
    this.writes = write.catch(() => undefined);
    return write;
  }
}
