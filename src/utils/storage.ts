/**
 * localStorage/sessionStorage를 안전하게 사용하기 위한 유틸리티
 * 브라우저 보안 설정으로 인해 접근이 차단될 수 있으므로 try-catch 처리
 */

// 메모리 기반 대체 저장소
const memoryStorage: { [key: string]: string } = {};
const memorySessionStorage: { [key: string]: string } = {};

// localStorage/sessionStorage가 사용 가능한지 확인
let isLocalStorageAvailable = false;
let isSessionStorageAvailable = false;

try {
  const testKey = '__storage_test__';
  localStorage.setItem(testKey, 'test');
  localStorage.removeItem(testKey);
  isLocalStorageAvailable = true;
} catch (e) {
  console.warn('localStorage를 사용할 수 없습니다. 메모리 저장소를 사용합니다.');
}

try {
  const testKey = '__storage_test__';
  sessionStorage.setItem(testKey, 'test');
  sessionStorage.removeItem(testKey);
  isSessionStorageAvailable = true;
} catch (e) {
  console.warn('sessionStorage를 사용할 수 없습니다. 메모리 저장소를 사용합니다.');
}

export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn('localStorage 접근 실패, 메모리 저장소 사용:', error);
      return memoryStorage[key] || null;
    }
  },

  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn('localStorage 저장 실패, 메모리 저장소 사용:', error);
      memoryStorage[key] = value;
    }
  },

  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('localStorage 삭제 실패, 메모리 저장소 사용:', error);
      delete memoryStorage[key];
    }
  },

  clear: (): void => {
    try {
      localStorage.clear();
    } catch (error) {
      console.warn('localStorage 초기화 실패, 메모리 저장소 사용:', error);
      Object.keys(memoryStorage).forEach(key => delete memoryStorage[key]);
    }
  },
};

export const safeSessionStorage = {
  getItem: (key: string): string | null => {
    try {
      return sessionStorage.getItem(key);
    } catch (error) {
      console.warn('sessionStorage 접근 실패, 메모리 저장소 사용:', error);
      return memorySessionStorage[key] || null;
    }
  },

  setItem: (key: string, value: string): void => {
    try {
      sessionStorage.setItem(key, value);
    } catch (error) {
      console.warn('sessionStorage 저장 실패, 메모리 저장소 사용:', error);
      memorySessionStorage[key] = value;
    }
  },

  removeItem: (key: string): void => {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.warn('sessionStorage 삭제 실패, 메모리 저장소 사용:', error);
      delete memorySessionStorage[key];
    }
  },

  clear: (): void => {
    try {
      sessionStorage.clear();
    } catch (error) {
      console.warn('sessionStorage 초기화 실패, 메모리 저장소 사용:', error);
      Object.keys(memorySessionStorage).forEach(key => delete memorySessionStorage[key]);
    }
  },
};
