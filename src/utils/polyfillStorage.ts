/**
 * localStorage/sessionStorage 폴리필
 * 브라우저에서 접근이 차단되었을 때 메모리 기반 저장소로 대체
 */

// 메모리 기반 저장소 구현
class MemoryStorage implements Storage {
  private data: Map<string, string> = new Map();

  get length(): number {
    return this.data.size;
  }

  clear(): void {
    this.data.clear();
  }

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  key(index: number): string | null {
    const keys = Array.from(this.data.keys());
    return keys[index] ?? null;
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

// 안전한 Storage 래퍼 - 모든 접근을 try-catch로 감싸기
class SafeStorageWrapper implements Storage {
  private fallback: MemoryStorage;
  private realStorage: Storage | null;

  constructor(storageType: 'localStorage' | 'sessionStorage') {
    this.fallback = new MemoryStorage();
    this.realStorage = null;

    try {
      const storage = window[storageType];
      const testKey = '__storage_test__';
      storage.setItem(testKey, 'test');
      storage.removeItem(testKey);
      this.realStorage = storage;
    } catch (e) {
      console.warn(`${storageType} 접근이 차단되어 메모리 저장소를 사용합니다.`);
    }
  }

  get length(): number {
    try {
      return this.realStorage?.length ?? this.fallback.length;
    } catch (e) {
      return this.fallback.length;
    }
  }

  clear(): void {
    try {
      this.realStorage?.clear();
    } catch (e) {
      // 무시
    }
    this.fallback.clear();
  }

  getItem(key: string): string | null {
    try {
      if (this.realStorage) {
        return this.realStorage.getItem(key);
      }
    } catch (e) {
      // 무시하고 fallback 사용
    }
    return this.fallback.getItem(key);
  }

  key(index: number): string | null {
    try {
      if (this.realStorage) {
        return this.realStorage.key(index);
      }
    } catch (e) {
      // 무시하고 fallback 사용
    }
    return this.fallback.key(index);
  }

  removeItem(key: string): void {
    try {
      this.realStorage?.removeItem(key);
    } catch (e) {
      // 무시
    }
    this.fallback.removeItem(key);
  }

  setItem(key: string, value: string): void {
    try {
      this.realStorage?.setItem(key, value);
    } catch (e) {
      // 무시하고 fallback 사용
    }
    this.fallback.setItem(key, value);
  }
}

// 즉시 폴리필 적용 (조건 없이 항상 SafeStorageWrapper 사용)
(function() {
  try {
    const safeLocalStorage = new SafeStorageWrapper('localStorage');
    const safeSessionStorage = new SafeStorageWrapper('sessionStorage');
    
    // 기존 localStorage/sessionStorage 완전히 대체
    Object.defineProperty(window, 'localStorage', {
      value: safeLocalStorage,
      writable: false,
      configurable: true,
    });
    
    Object.defineProperty(window, 'sessionStorage', {
      value: safeSessionStorage,
      writable: false,
      configurable: true,
    });
  } catch (e) {
    console.error('Storage 폴리필 적용 실패:', e);
  }
})();
