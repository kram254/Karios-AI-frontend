import { unstable_batchedUpdates } from 'react-dom';

export function batchStateUpdates(updates: () => void) {
  unstable_batchedUpdates(updates);
}

export class BatchedUpdateQueue {
  private queue: Array<() => void> = [];
  private timeoutId: NodeJS.Timeout | null = null;
  private readonly delay: number;

  constructor(delay: number = 50) {
    this.delay = delay;
  }

  enqueue(update: () => void) {
    this.queue.push(update);

    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      this.flush();
    }, this.delay);
  }

  flush() {
    if (this.queue.length === 0) return;

    const updates = [...this.queue];
    this.queue = [];
    this.timeoutId = null;

    unstable_batchedUpdates(() => {
      updates.forEach(update => update());
    });
  }

  clear() {
    this.queue = [];
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}
