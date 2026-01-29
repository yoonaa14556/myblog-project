import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast, Toaster } from 'sonner';

export const SignupPage = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // 유효성 검사
    if (password !== confirmPassword) {
      toast.error('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (password.length < 8) {
      toast.error('비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }

    if (!nickname.trim()) {
      toast.error('닉네임을 입력해주세요.');
      return;
    }

    if (bio.length > 200) {
      toast.error('자기소개는 200자 이내로 입력해주세요.');
      return;
    }

    setLoading(true);

    try {
      await signUp({
        email,
        password,
        nickname: nickname.trim(),
        bio: bio.trim(),
      });
      
      toast.success('회원가입 성공! 이메일을 확인해주세요.');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (error: any) {
      console.error('회원가입 실패:', error);
      
      // 이미 가입된 이메일 에러 처리
      if (error.message?.includes('already registered') || 
          error.message?.includes('already been registered')) {
        toast.error('이미 가입된 이메일입니다.');
      } else {
        toast.error(error.message || '회원가입에 실패했습니다.');
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
            <h1 className="text-4xl font-bold text-gray-900">회원가입</h1>
            <p className="text-gray-600 mt-2">myblog에서 당신의 이야기를 시작하세요</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 bg-white p-8 rounded-2xl shadow-xl">
            {/* 이메일 */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                이메일 주소 *
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
                비밀번호 * <span className="text-xs text-gray-500">(8자 이상)</span>
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="최소 8자 이상"
                required
                minLength={8}
              />
            </div>

            {/* 비밀번호 확인 */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                비밀번호 확인 *
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="비밀번호를 다시 입력하세요"
                required
                minLength={8}
              />
            </div>

            {/* 닉네임 */}
            <div>
              <label htmlFor="nickname" className="block text-sm font-semibold text-gray-700 mb-2">
                닉네임 *
              </label>
              <input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="사용할 닉네임을 입력하세요"
                required
                maxLength={50}
              />
            </div>

            {/* 자기소개 */}
            <div>
              <label htmlFor="bio" className="block text-sm font-semibold text-gray-700 mb-2">
                자기소개 <span className="text-xs text-gray-500">(선택, {bio.length}/200자)</span>
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                placeholder="간단한 자기소개를 작성해보세요"
                rows={4}
                maxLength={200}
              />
            </div>

            {/* 회원가입 버튼 */}
            <Button 
              type="submit" 
              className="w-full py-3 text-base font-semibold" 
              disabled={loading}
            >
              {loading ? '가입 중...' : '회원가입'}
            </Button>

            {/* 로그인 링크 */}
            <p className="text-center text-sm text-gray-600 pt-4">
              이미 계정이 있으신가요?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline">
                로그인
              </Link>
            </p>
          </form>
        </div>
      </div>
    </>
  );
};
