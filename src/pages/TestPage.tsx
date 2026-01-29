import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export const TestPage = () => {
  const [status, setStatus] = useState<string>('테스트 중...');
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      // 1. Supabase 연결 테스트
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        setStatus('❌ 세션 로딩 실패');
        setDetails({ error: sessionError.message });
        return;
      }

      // 2. 테이블 접근 테스트
      const { error: postsError } = await supabase
        .from('posts')
        .select('count');

      if (postsError) {
        setStatus('❌ 테이블 접근 실패');
        setDetails({ error: postsError.message });
        return;
      }

      setStatus('✅ 모든 연결 정상!');
      setDetails({
        session: session?.session ? '로그인됨' : '로그인 안됨',
        posts: '테이블 접근 가능',
      });
    } catch (error: any) {
      setStatus('❌ 연결 에러');
      setDetails({ error: error.message });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Supabase 연결 테스트</h1>
        <div className="mb-4">
          <div className="text-lg font-semibold">{status}</div>
        </div>
        {details && (
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(details, null, 2)}
          </pre>
        )}
        <button
          onClick={testConnection}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          다시 테스트
        </button>
      </div>
    </div>
  );
};
