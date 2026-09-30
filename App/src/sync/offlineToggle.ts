// App/src/sync/offlineToggle.ts

/**
 * TODO: Manual Offline Simulation and Force-Sync Toggle
 */
export class OfflineToggleService {
  private forcedOffline = false;

  public setForcedOffline(val: boolean) {
    this.forcedOffline = val;
  }

  public isForcedOffline(): boolean {
    return this.forcedOffline;
  }
}

export const offlineToggle = new OfflineToggleService();
