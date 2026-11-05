export interface CompanionSettings {
  version: 2;
  headingAlignment: 'left' | 'right';
  diagramsEnabled: boolean;
  zenMode: boolean;
}
export const DEFAULT_SETTINGS: CompanionSettings = {
  version: 2, headingAlignment: 'right', diagramsEnabled: true, zenMode: false,
};
export function normalizeSettings(value: unknown): CompanionSettings {
  const saved = value !== null && typeof value === 'object' ? value as Record<string, unknown> : {};
  return {
    version: DEFAULT_SETTINGS.version,
    headingAlignment: saved.headingAlignment === 'left' ? 'left' : 'right',
    // The v1 switch opted all ordinary flowcharts into ELK. V2 lets each diagram opt in.
    diagramsEnabled: saved.version === 2 && typeof saved.diagramsEnabled === 'boolean'
      ? saved.diagramsEnabled : DEFAULT_SETTINGS.diagramsEnabled,
    zenMode: saved.zenMode === true,
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
