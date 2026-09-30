// App/src/crypto/lockManager.ts

type LockCallback = () => void;

class LockManager {
  private timeoutMs: number = 5 * 60 * 1000; // 5 minutes idle
  private timer: any = null;
  private listeners: Set<LockCallback> = new Set();
  private isLocked: boolean = true;

  constructor() {
    this.setupListeners();
  }

  private setupListeners() {
    if (typeof window === 'undefined') return;

    const resetTimer = () => {
      if (!this.isLocked) {
        this.startTimer();
      }
    };

    ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll'].forEach(evt => {
      window.addEventListener(evt, resetTimer, { passive: true });
    });

    // Auto-lock when tab is hidden / backgrounded
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && !this.isLocked) {
        this.lock();
      }
    });
  }

  public startTimer() {
    this.clearTimer();
    this.timer = setTimeout(() => {
      this.lock();
    }, this.timeoutMs);
  }

  public clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  public lock() {
    this.isLocked = true;
    this.clearTimer();
    this.listeners.forEach(cb => cb());
  }

  public unlock() {
    this.isLocked = false;
    this.startTimer();
  }

  public onLock(cb: LockCallback): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  public getLockedState(): boolean {
    return this.isLocked;
  }
}

export const lockManager = new LockManager();
