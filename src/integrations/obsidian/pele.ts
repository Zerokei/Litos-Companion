/** The subset of the public Pele mount API used by Obsidian note diagrams. */
interface MountOptions {
  sanitize?: (svg: string) => Node;
  onRender?: (result: DiagramResult) => void;
}
interface DiagramResult {
  svg: string;
  width: number;
  height: number;
  type: string;
  mermaidType: string;
  links: unknown[];
}
interface Mount {
  readonly source: string;
  readonly result?: DiagramResult;
  readonly error?: unknown;
  readonly zoom?: unknown;
  update(source: string, options?: MountOptions): void;
  refresh(): void;
  destroy(): void;
}
type MountDiagram = (element: HTMLElement, source: string, options?: MountOptions) => Mount;
type Prepare = (source: string) => string | null;
type Render = (id: string, prepared: string, container: Element, isCurrent: () => boolean) => Promise<{ svg: string } | null>;
type PeleWindow = Window & { pele?: { mount: MountDiagram } };
let renderId = 0;

/**
 * Obsidian reuses the same mount when Live Preview edits a fence and when
 * Reading view recycles a block. Keep the native controller (including its
 * observers and zoom controls) only while Pele owns the diagram.
 */
class NoteMount implements Mount {
  private native?: Mount;
  private elk?: DiagramResult;
  private generation = 0;
  private destroyed = false;
  private refreshOnInsert = false;

  constructor(
    private element: HTMLElement, public source: string, private options: MountOptions,
    private mount: MountDiagram, private prepare: Prepare, private render: Render,
    private failed: (error: unknown) => void,
  ) {}

  get result(): DiagramResult | undefined { return this.native?.result ?? this.elk; }
  get error(): unknown { return this.native?.error; }
  get zoom(): unknown { return this.native?.zoom; }

  update(source: string, options = this.options): void {
    if (this.destroyed) return;
    this.source = source;
    this.options = options;
    this.route(this.prepare(source));
  }

  /** A host refresh can reach recycled sections that are currently off screen. */
  invalidate(): void {
    if (this.destroyed) return;
    const prepared = this.prepare(this.source);
    if (prepared === null && this.native) {
      this.refreshOnInsert = false;
      return;
    }
    if (prepared !== null && !this.element.isConnected) {
      this.generation++;
      this.refreshOnInsert = true;
      return;
    }
    this.route(prepared);
  }

  private route(prepared: string | null): void {
    const generation = ++this.generation;
    this.refreshOnInsert = false;
    if (prepared === null) {
      this.useNative();
      return;
    }
    this.native?.destroy();
    this.native = undefined;
    void this.draw(prepared, generation);
  }

  private useNative(): void {
    this.elk = undefined;
    if (this.native) this.native.update(this.source, this.options);
    else this.native = this.mount(this.element, this.source, this.options);
  }

  private async draw(prepared: string, generation: number): Promise<void> {
    try {
      const result = await this.render(`litos-elk-${++renderId}`, prepared, this.element, () => generation === this.generation);
      if (generation !== this.generation) return;
      if (!result) { this.useNative(); return; }
      // Use the sanitizer supplied by Obsidian for this note, just as Pele does.
      const sanitized = this.options.sanitize!(result.svg);
      const root = sanitized.nodeType === 1 ? sanitized as Element : (sanitized as DocumentFragment).firstElementChild;
      if (root?.localName !== 'svg') throw new Error('ELK did not produce a diagram');
      const box = root.getAttribute('viewBox')?.trim().split(/[\s,]+/).map(Number);
      this.elk = { svg: result.svg, width: box?.[2] ?? 0, height: box?.[3] ?? 0,
        type: 'flowchart', mermaidType: 'flowchart-v2', links: [] };
      this.element.replaceChildren(sanitized);
      this.options.onRender?.(this.elk);
    } catch (error) {
      if (generation !== this.generation) return;
      this.failed(error);
      this.useNative();
    }
  }

  refresh(): void {
    if (this.refreshOnInsert && this.element.isConnected) this.invalidate();
    else this.native?.refresh();
  }
  destroy(): void {
    this.destroyed = true;
    this.generation++;
    this.native?.destroy();
    this.native = undefined;
    this.elk = undefined;
  }
}

/** Install after loadMermaid() has initialized window.pele (Obsidian 1.15+). */
export function interceptPele(
  scope: Window, prepare: Prepare, render: Render, failed: (error: unknown) => void,
): { refresh(): void; restore(): void } | null {
  const win = scope as PeleWindow;
  const original = win.pele;
  if (typeof original?.mount !== 'function') return null;
  let active = true;
  const mounts = new WeakMap<HTMLElement, NoteMount>();
  const live = new Set<WeakRef<NoteMount>>();
  const finalizer = new FinalizationRegistry<WeakRef<NoteMount>>(ref => live.delete(ref));
  const mount: MountDiagram = (element, source, options) => {
    if (!active || !element.classList.contains('mermaid') || typeof options?.sanitize !== 'function') {
      return original.mount(element, source, options);
    }
    mounts.get(element)?.destroy();
    const handle = new NoteMount(element, source, options, original.mount.bind(original),
      text => active ? prepare(text) : null, render, failed);
    mounts.set(element, handle);
    const ref = new WeakRef(handle);
    live.add(ref);
    finalizer.register(handle, ref);
    handle.update(source);
    return handle;
  };
  // Pele exposes read-only module getters. Forward every export through the
  // original namespace, changing only note mounts for the lifetime of the plugin.
  const wrapped = new Proxy(original, { get(target, key, receiver) {
    return key === 'mount' ? mount : Reflect.get(target, key, receiver) as unknown;
  } });
  win.pele = wrapped;
  const refresh = () => {
    for (const ref of live) {
      const handle = ref.deref();
      if (handle) handle.invalidate();
      else live.delete(ref);
    }
  };
  return {
    refresh,
    restore() {
      active = false;
      if (win.pele === wrapped) win.pele = original;
      refresh();
      live.clear();
    },
  };
}
