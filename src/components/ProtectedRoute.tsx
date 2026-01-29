import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast, Toaster } from 'sonner';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      // 현재 경로를 state로 저장하여 로그인 후 돌아올 수 있게 함
      toast.error('로그인이 필요합니다.');
      navigate('/login', { 
        state: { from: location.pathname },
        replace: true 
      });
    }
  }, [user, loading, navigate, location]);

  // 로딩 중일 때
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-gray-600">로딩 중...</div>
      </div>
    );
  }

  // 로그인하지 않은 경우 (리다이렉트 진행 중)
  if (!user) {
    return (
      <>
        <Toaster position="top-center" richColors />
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-xl text-gray-600">로그인 페이지로 이동 중...</div>
        </div>
      </>
    );
  }

  // 로그인한 경우 페이지 렌더링
  return <>{children}</>;
};
