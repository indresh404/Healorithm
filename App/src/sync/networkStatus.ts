// App/src/sync/networkStatus.ts

export type NetworkMode = 'online' | 'offline' | 'simulated_offline' | '2g_poor';

type NetworkListener = (mode: NetworkMode) => void;

class NetworkStatusManager {
  private mode: NetworkMode = 'online';
  private listeners: Set<NetworkListener> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      this.mode = navigator.onLine ? 'online' : 'offline';
      window.addEventListener('online', () => this.handleNativeChange(true));
      window.addEventListener('offline', () => this.handleNativeChange(false));
    }
  }

  private handleNativeChange(isOnline: boolean) {
    if (this.mode === 'simulated_offline') return;
    this.mode = isOnline ? 'online' : 'offline';
    this.notify();
  }

  private notify() {
    this.listeners.forEach(cb => cb(this.mode));
  }

  public getMode(): NetworkMode {
    return this.mode;
  }

  public isConnected(): boolean {
    return this.mode === 'online' || this.mode === '2g_poor';
  }

  public setSimulatedMode(mode: NetworkMode) {
    this.mode = mode;
    this.notify();
  }

  public subscribe(listener: NetworkListener): () => void {
    this.listeners.add(listener);
    listener(this.mode);
    return () => this.listeners.delete(listener);
  }
}

export const networkManager = new NetworkStatusManager();
