import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { safeStorage, safeSessionStorage } from '@/utils/storage';

interface SignUpData {
  email: string;
  password: string;
  nickname: string;
  bio?: string;
}

interface Profile {
  id: string;
  email: string;
  nickname: string;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (data: SignUpData) => Promise<void>;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth는 AuthProvider 내부에서 사용되어야 합니다.');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // 프로필 정보 가져오기
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle(); // single 대신 maybeSingle 사용 (결과 없어도 에러 안남)

      if (error) {
        // AbortError 무시
        if (error.name === 'AbortError') {
          return null;
        }
        console.error('프로필 로딩 실패:', error);
        return null;
      }
      return data;
    } catch (error: any) {
      // AbortError 무시
      if (error?.name === 'AbortError') {
        return null;
      }
      console.error('프로필 가져오기 에러:', error);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let subscription: { unsubscribe: () => void } | null = null;

    const initAuth = async () => {
      try {
        // 현재 세션 확인
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          // AbortError 무시 (React StrictMode에서 정상적인 동작)
          if (error.name === 'AbortError') {
            return;
          }
          console.error('세션 로딩 에러:', error);
          if (isMounted) {
            setLoading(false);
          }
          return;
        }

        if (!isMounted) return;

        // 로그인 상태 유지가 false이고 세션이 있으면 체크
        const rememberMe = safeStorage.getItem('myblog-remember-me');
        const sessionActive = safeSessionStorage.getItem('myblog-session-active');
        
        if (session && rememberMe === 'false' && !sessionActive) {
          // 브라우저를 새로 열었는데 로그인 유지를 원하지 않았으면 로그아웃
          await supabase.auth.signOut();
          if (isMounted) {
            setSession(null);
            setUser(null);
            setProfile(null);
          }
        } else {
          if (isMounted) {
            setSession(session);
            setUser(session?.user ?? null);
          }
          
          // 프로필 정보 가져오기
          if (session?.user && isMounted) {
            const profileData = await fetchProfile(session.user.id);
            if (isMounted) {
              setProfile(profileData);
            }
          }
        }
        
        if (isMounted) {
          setLoading(false);
        }
      } catch (error: any) {
        // AbortError 무시
        if (error?.name === 'AbortError') {
          return;
        }
        console.error('인증 초기화 에러:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // 초기 인증 상태 확인
    initAuth();

    // 인증 상태 변경 리스너
    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      // 프로필 정보 가져오기
      if (session?.user) {
        const profileData = await fetchProfile(session.user.id);
        if (isMounted) {
          setProfile(profileData);
        }
      } else {
        setProfile(null);
      }
    });

    subscription = authSubscription;

    return () => {
      isMounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const signUp = async ({ email, password, nickname, bio }: SignUpData) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nickname,
          bio: bio || '',
        },
      },
    });
    if (error) throw error;
  };

  const signIn = async (email: string, password: string, rememberMe: boolean = false) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;

    // 로그인 상태 유지 여부를 로컬 스토리지에 저장
    if (rememberMe) {
      safeStorage.setItem('myblog-remember-me', 'true');
    } else {
      safeStorage.setItem('myblog-remember-me', 'false');
      // 브라우저 종료 시 자동 로그아웃을 위한 플래그 설정
      safeSessionStorage.setItem('myblog-session-active', 'true');
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
