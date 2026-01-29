import { useState, FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast, Toaster } from 'sonner';

export const LoginPage = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  // 이전 페이지 경로 가져오기 (리다이렉트 처리)
  const from = (location.state as { from?: string })?.from || '/';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn(email, password, rememberMe);
      toast.success('로그인 성공!');
      setTimeout(() => {
        // 원래 가려던 페이지로 이동
        navigate(from, { replace: true });
      }, 800);
    } catch (error: any) {
      console.error('로그인 실패:', error);
      
      // 에러 메시지 처리
      if (error.message?.includes('Invalid login credentials') || 
          error.message?.includes('invalid') ||
          error.message?.includes('credentials')) {
        toast.error('이메일 또는 비밀번호가 틀렸습니다.');
      } else {
        toast.error(error.message || '로그인에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster position="top-center" richColors />
      <div className="flex min-h-screen items-center justify-center px-4 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900">로그인</h1>
            <p className="text-gray-600 mt-2">myblog에 오신 것을 환영합니다</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 bg-white p-8 rounded-2xl shadow-xl">
            {/* 이메일 */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                이메일 주소
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="example@email.com"
                required
              />
            </div>

            {/* 비밀번호 */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="비밀번호를 입력하세요"
                required
              />
            </div>

            {/* 로그인 상태 유지 체크박스 */}
            <div className="flex items-center">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
              />
              <label 
                htmlFor="rememberMe" 
                className="ml-2 text-sm font-medium text-gray-700 cursor-pointer select-none"
              >
                로그인 상태 유지
              </label>
            </div>

            {/* 로그인 버튼 */}
            <Button 
              type="submit" 
              className="w-full py-3 text-base font-semibold" 
              disabled={loading}
            >
              {loading ? '로그인 중...' : '로그인'}
            </Button>

            {/* 회원가입 링크 */}
            <p className="text-center text-sm text-gray-600 pt-4">
              계정이 없으신가요?{' '}
              <Link to="/signup" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline">
                회원가입
              </Link>
            </p>
          </form>
        </div>
      </div>
    </>
  );
};
