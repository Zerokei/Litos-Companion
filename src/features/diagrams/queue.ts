export class RenderQueue {
  private tail: Promise<unknown> = Promise.resolve();
  run<T>(work: () => Promise<T>): Promise<T> {
    const task = this.tail.then(work);
    this.tail = task.catch(() => undefined);
    return task;
  }
}
