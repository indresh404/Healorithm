// App/src/auth/authStore.ts
import { deriveKeyFromPIN } from '../crypto/keyDerivation';
import { lockManager } from '../crypto/lockManager';

export type UserRole = 'worker' | 'patient';

export interface AuthState {
  isAuthenticated: boolean;
  role: UserRole;
  userId: string;
  userName: string;
  village?: string;
  cryptoKey: CryptoKey | null;
  isUnlocked: boolean;
}

const AUTH_STORAGE_KEY = 'healorithm_app_auth_session';

class AuthStoreManager {
  private state: AuthState = {
    isAuthenticated: true, // Default ready for immediate offline demo
    role: 'worker',
    userId: 'w2',
    userName: 'Lakshmi P.',
    village: 'Adoni',
    cryptoKey: null,
    isUnlocked: true
  };

  private listeners: Set<() => void> = new Set();

  constructor() {
    this.initDefaultKey();
    lockManager.onLock(() => {
      this.state.isUnlocked = false;
      this.notify();
    });
  }

  private async initDefaultKey() {
    try {
      this.state.cryptoKey = await deriveKeyFromPIN('1234');
      this.notify();
    } catch (e) {
      console.warn('Failed to derive default key:', e);
    }
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  public getState(): AuthState {
    return this.state;
  }

  public async loginWorker(workerId: string, pin: string, workerName: string = 'Lakshmi P.', village: string = 'Adoni') {
    const key = await deriveKeyFromPIN(pin);
    this.state = {
      isAuthenticated: true,
      role: 'worker',
      userId: workerId,
      userName: workerName,
      village,
      cryptoKey: key,
      isUnlocked: true
    };
    lockManager.unlock();
    this.notify();
  }

  public async loginPatient(mobile: string, pin: string, patientName: string = 'Indresh', patientId: string = 'u-101') {
    const key = await deriveKeyFromPIN(pin);
    this.state = {
      isAuthenticated: true,
      role: 'patient',
      userId: patientId,
      userName: patientName,
      village: 'Adoni',
      cryptoKey: key,
      isUnlocked: true
    };
    lockManager.unlock();
    this.notify();
  }

  public switchRole(role: UserRole) {
    this.state.role = role;
    if (role === 'patient') {
      this.state.userId = 'u-101';
      this.state.userName = 'Indresh';
    } else {
      this.state.userId = 'w2';
      this.state.userName = 'Lakshmi P.';
    }
    this.notify();
  }

  public unlock(pin: string): Promise<boolean> {
    return deriveKeyFromPIN(pin).then(key => {
      this.state.cryptoKey = key;
      this.state.isUnlocked = true;
      lockManager.unlock();
      this.notify();
      return true;
    }).catch(() => false);
  }

  public lock() {
    this.state.isUnlocked = false;
    lockManager.lock();
    this.notify();
  }

  public logout() {
    this.state = {
      isAuthenticated: false,
      role: 'worker',
      userId: '',
      userName: '',
      cryptoKey: null,
      isUnlocked: false
    };
    this.notify();
  }
}

export const authStore = new AuthStoreManager();
