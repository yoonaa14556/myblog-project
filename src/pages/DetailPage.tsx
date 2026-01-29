import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { CommentSection } from '@/components/CommentSection';
import { toast, Toaster } from 'sonner';

interface Post {
  id: string;
  title: string;
  content: string;
  created_at: string;
  author_id: string;
  tags: string[];
  is_public: boolean;
  slug: string | null;
  views: number;
  likes_count: number;
  comments_count: number;
  profiles?: {
    nickname: string;
    avatar_url: string | null;
  };
}

export const DetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPost();
      if (user) {
        checkIfLiked();
      }
    }
  }, [id, user]);

  const fetchPost = async () => {
    try {
      const { data: postData, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // 작성자 프로필 정보 가져오기
      const { data: profileData } = await supabase
        .from('profiles')
        .select('nickname, avatar_url')
        .eq('id', postData.author_id)
        .single();

      // 조회수 증가
      await supabase
        .from('posts')
        .update({ views: (postData.views || 0) + 1 })
        .eq('id', id);
      
      const postWithProfile = {
        ...postData,
        profiles: profileData || { nickname: '알 수 없음', avatar_url: null }
      };

      setPost(postWithProfile);
      setLikesCount(postData.likes_count || 0);
    } catch (error) {
      console.error('게시글 로딩 실패:', error);
      toast.error('게시글을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const checkIfLiked = async () => {
    if (!user || !id) return;

    try {
      const { data, error } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setIsLiked(!!data);
    } catch (error) {
      console.error('좋아요 상태 확인 실패:', error);
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast.error('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    // 애니메이션 시작
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 600);

    try {
      if (isLiked) {
        // 좋아요 취소
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', id)
          .eq('user_id', user.id);

        if (error) throw error;
        
        setIsLiked(false);
        setLikesCount(prev => prev - 1);
      } else {
        // 좋아요 추가
        const { error } = await supabase
          .from('likes')
          .insert([{ post_id: id, user_id: user.id }]);

        if (error) {
          // 중복 좋아요 시도 시 (unique constraint 위반)
          if (error.code === '23505') {
            toast.error('이미 좋아요를 누르셨습니다.');
            setIsLiked(true);
          } else {
            throw error;
          }
        } else {
          setIsLiked(true);
          setLikesCount(prev => prev + 1);
        }
      }
    } catch (error: any) {
      console.error('좋아요 처리 실패:', error);
      toast.error(error.message || '좋아요 처리에 실패했습니다.');
      // 실패 시 애니메이션 중단
      setIsAnimating(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('주소가 복사되었습니다!');
    } catch (error) {
      toast.error('주소 복사에 실패했습니다.');
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase.from('posts').delete().eq('id', id);

      if (error) throw error;
      toast.success('게시글이 삭제되었습니다.');
      navigate('/');
    } catch (error) {
      console.error('삭제 실패:', error);
      toast.error('게시글 삭제에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-gray-600">로딩 중...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-center text-gray-500">게시글을 찾을 수 없습니다.</p>
        <div className="text-center mt-4">
          <Button onClick={() => navigate('/')}>메인으로 돌아가기</Button>
        </div>
      </div>
    );
  }

  const isAuthor = user?.id === post.author_id;

  return (
    <>
      <Toaster position="top-center" richColors />
      
      {/* 삭제 확인 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-xl font-bold mb-4">게시글 삭제</h3>
            <p className="text-gray-600 mb-6">정말 삭제하시겠습니까?</p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1"
              >
                취소
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setShowDeleteModal(false);
                  handleDelete();
                }}
                className="flex-1"
              >
                삭제
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* 뒤로 가기 버튼 */}
          <div className="mb-6">
            <Button variant="outline" onClick={() => navigate(-1)}>
              ← 돌아가기
            </Button>
          </div>

          {/* 메인 컨텐츠 */}
          <article className="bg-white rounded-xl shadow-sm border p-8 md:p-12">
            {/* 헤더 영역 */}
            <header className="mb-8 pb-8 border-b">
              {/* 제목 */}
              <h1 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
                {post.title}
              </h1>

              {/* 작성자 정보 */}
              <div className="flex items-center gap-4 mb-6">
                {/* 프로필 사진 */}
                {post.profiles?.avatar_url ? (
                  <img
                    src={post.profiles.avatar_url}
                    alt={post.profiles.nickname}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-lg font-semibold">
                    {(post.profiles?.nickname || '?')[0]?.toUpperCase()}
                  </div>
                )}

                <div>
                  <div className="font-semibold text-gray-900">
                    {post.profiles?.nickname || '알 수 없음'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(post.created_at).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>

                {/* 통계 */}
                <div className="ml-auto flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {post.views}
                  </span>
                  {!post.is_public && (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                      🔒 비공개
                    </span>
                  )}
                </div>
              </div>

              {/* 태그 */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </header>

            {/* 본문 */}
            <div className="prose prose-lg max-w-none mb-8">
              <div className="whitespace-pre-wrap leading-relaxed text-gray-800">
                {post.content}
              </div>
            </div>

            {/* 하단 버튼들 */}
            <div className="pt-8 border-t">
              <div className="flex flex-wrap gap-3 items-center">
                {/* 좋아요 버튼 */}
                <button
                  onClick={handleLike}
                  className={`group flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    isLiked 
                      ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <svg 
                    className={`w-6 h-6 transition-all ${
                      isAnimating ? 'animate-[heartBeat_0.6s_ease-in-out]' : ''
                    }`}
                    fill={isLiked ? 'currentColor' : 'none'} 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span>
                    {likesCount === 0 
                      ? '좋아요' 
                      : `${likesCount}명이 좋아합니다`
                    }
                  </span>
                </button>

                {/* 공유 버튼 */}
                <Button
                  onClick={handleShare}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  공유
                </Button>

                {/* 작성자 전용 버튼 */}
                {isAuthor && (
                  <>
                    <div className="flex-1" />
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/edit/${post.id}`)}
                      className="flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      수정
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setShowDeleteModal(true)}
                      className="flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      삭제
                    </Button>
                  </>
                )}
              </div>
            </div>
          </article>

          {/* 댓글 섹션 */}
          <CommentSection postId={id!} />
        </div>
      </div>
    </>
  );
};
