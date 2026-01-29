import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { ProfileEditModal } from '@/components/ProfileEditModal';
import { toast, Toaster } from 'sonner';
import { Edit2, FileText, Heart, Calendar, ArrowUpDown, Globe, Lock, Eye, MessageCircle, Pencil, Trash2 } from 'lucide-react';

interface Stats {
  postsCount: number;
  totalLikes: number;
}

interface Post {
  id: string;
  title: string;
  created_at: string;
  views: number;
  likes_count: number;
  comments_count: number;
  is_public: boolean;
  slug: string;
}

type TabType = 'my-posts' | 'liked-posts';
type SortType = 'latest' | 'popular' | 'views';
type FilterType = 'all' | 'public' | 'private';

export const MyPage = () => {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({ postsCount: 0, totalLikes: 0 });
  const [loadingStats, setLoadingStats] = useState(true);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  
  // 탭 관련
  const [activeTab, setActiveTab] = useState<TabType>('my-posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  
  // 정렬 및 필터
  const [sortBy, setSortBy] = useState<SortType>('latest');
  const [filterBy, setFilterBy] = useState<FilterType>('all');
  
  // 호버 상태
  const [hoveredPostId, setHoveredPostId] = useState<string | null>(null);

  // 통계 정보 가져오기
  useEffect(() => {
    if (user) {
      fetchStats();
      fetchMyPosts();
      fetchLikedPosts();
    }
  }, [user]);

  // 정렬/필터 변경 시 다시 가져오기
  useEffect(() => {
    if (user) {
      if (activeTab === 'my-posts') {
        fetchMyPosts();
      } else {
        fetchLikedPosts();
      }
    }
  }, [sortBy, filterBy, activeTab]);

  const fetchStats = async () => {
    if (!user) return;

    try {
      setLoadingStats(true);

      // 작성한 글 수
      const { count: postsCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', user.id);

      // 받은 좋아요 총합
      const { data: posts } = await supabase
        .from('posts')
        .select('likes_count')
        .eq('author_id', user.id);

      const totalLikes = posts?.reduce((sum, post) => sum + (post.likes_count || 0), 0) || 0;

      setStats({
        postsCount: postsCount || 0,
        totalLikes,
      });
    } catch (error) {
      console.error('통계 로딩 실패:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleProfileEditSuccess = () => {
    // 프로필 편집 성공 시 통계도 새로고침
    fetchStats();
  };

  const fetchMyPosts = async () => {
    if (!user) return;

    try {
      setLoadingPosts(true);

      let query = supabase
        .from('posts')
        .select('id, title, created_at, views, likes_count, comments_count, is_public, slug')
        .eq('author_id', user.id);

      // 필터 적용
      if (filterBy === 'public') {
        query = query.eq('is_public', true);
      } else if (filterBy === 'private') {
        query = query.eq('is_public', false);
      }

      // 정렬 적용
      if (sortBy === 'latest') {
        query = query.order('created_at', { ascending: false });
      } else if (sortBy === 'popular') {
        query = query.order('likes_count', { ascending: false });
      } else if (sortBy === 'views') {
        query = query.order('views', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;

      setPosts(data || []);
    } catch (error) {
      console.error('글 목록 로딩 실패:', error);
      toast.error('글 목록을 불러올 수 없습니다.');
    } finally {
      setLoadingPosts(false);
    }
  };

  const fetchLikedPosts = async () => {
    if (!user) return;

    try {
      setLoadingPosts(true);

      // likes 테이블과 posts 테이블 조인
      let query = supabase
        .from('likes')
        .select(`
          post_id,
          posts!inner (
            id,
            title,
            created_at,
            views,
            likes_count,
            comments_count,
            is_public,
            slug
          )
        `)
        .eq('user_id', user.id);

      const { data, error } = await query;

      if (error) throw error;

      // 데이터 변환
      const postsData = data?.map((item: any) => item.posts).filter(Boolean) || [];

      // 정렬 적용
      let sortedPosts = [...postsData];
      if (sortBy === 'latest') {
        sortedPosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      } else if (sortBy === 'popular') {
        sortedPosts.sort((a, b) => b.likes_count - a.likes_count);
      } else if (sortBy === 'views') {
        sortedPosts.sort((a, b) => b.views - a.views);
      }

      setLikedPosts(sortedPosts);
    } catch (error) {
      console.error('좋아요한 글 목록 로딩 실패:', error);
      toast.error('좋아요한 글 목록을 불러올 수 없습니다.');
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      toast.success('글이 삭제되었습니다.');
      fetchMyPosts();
      fetchStats();
    } catch (error) {
      console.error('글 삭제 실패:', error);
      toast.error('글 삭제에 실패했습니다.');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('로그아웃되었습니다.');
      navigate('/');
    } catch (error) {
      console.error('로그아웃 실패:', error);
      toast.error('로그아웃에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">로딩 중...</div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-center" richColors />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">마이 페이지</h1>

        <div className="bg-white border rounded-xl shadow-lg overflow-hidden">
          {/* 프로필 헤더 */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-32"></div>
          
          <div className="px-8 pb-8">
            {/* 프로필 아바타 */}
            <div className="relative -mt-16 mb-4">
              <div 
                className="group relative w-32 h-32 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center cursor-pointer"
                onClick={() => setShowProfileEdit(true)}
              >
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt="프로필" 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-4xl font-bold">
                    {profile?.nickname?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                
                {/* 호버 시 변경 버튼 */}
                <div className="absolute inset-0 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 text-white font-semibold text-sm transition-opacity">
                    변경
                  </span>
                </div>
              </div>
            </div>

            {/* 프로필 정보 */}
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-gray-900">{profile?.nickname || '사용자'}</h2>
                  {profile?.bio ? (
                    <p className="text-gray-600 mt-2 text-lg">{profile.bio}</p>
                  ) : (
                    <p className="text-gray-400 mt-2 text-sm italic">한줄 소개를 작성해보세요</p>
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowProfileEdit(true)}
                  className="flex items-center gap-2"
                >
                  <Edit2 size={16} />
                  프로필 편집
                </Button>
              </div>

              {/* 통계 정보 */}
              <div className="grid grid-cols-2 gap-4 py-6 border-y">
                <div className="text-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div className="text-sm text-gray-600">작성한 글</div>
                  </div>
                  <div className="text-3xl font-bold text-blue-600">
                    {loadingStats ? '...' : stats.postsCount}
                  </div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors cursor-pointer">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Heart className="w-5 h-5 text-red-600" />
                    <div className="text-sm text-gray-600">받은 좋아요</div>
                  </div>
                  <div className="text-3xl font-bold text-red-600">
                    {loadingStats ? '...' : stats.totalLikes}
                  </div>
                </div>
              </div>

              {/* 내 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm text-gray-500 font-semibold">📧 이메일</div>
                  <div className="font-medium text-gray-800">{profile?.email}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-gray-500 font-semibold flex items-center gap-1">
                    <Calendar size={14} />
                    가입일
                  </div>
                  <div className="font-medium text-gray-800">
                    {profile?.created_at
                      ? new Date(profile.created_at).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t">
              <Button 
                variant="default" 
                onClick={() => navigate('/write')}
                className="flex-1 min-w-[120px]"
              >
                ✍️ 글쓰기
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/')}
                className="flex-1 min-w-[120px]"
              >
                🏠 메인으로
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleSignOut}
                className="flex-1 min-w-[120px] md:ml-auto md:flex-initial"
              >
                로그아웃
              </Button>
            </div>
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div className="mt-8">
          <div className="flex gap-2 border-b">
            <button
              onClick={() => setActiveTab('my-posts')}
              className={`px-6 py-3 font-semibold transition-all ${
                activeTab === 'my-posts'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📝 작성한 글
            </button>
            <button
              onClick={() => setActiveTab('liked-posts')}
              className={`px-6 py-3 font-semibold transition-all ${
                activeTab === 'liked-posts'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ❤️ 좋아요한 글
            </button>
          </div>

          {/* 정렬 및 필터 */}
          <div className="flex flex-wrap gap-3 mt-4 mb-6">
            <div className="flex gap-2">
              <span className="text-sm text-gray-600 font-semibold flex items-center">
                <ArrowUpDown className="w-4 h-4 mr-1" />
                정렬:
              </span>
              <button
                onClick={() => setSortBy('latest')}
                className={`px-3 py-1 text-sm rounded-full transition-all ${
                  sortBy === 'latest'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                최신순
              </button>
              <button
                onClick={() => setSortBy('popular')}
                className={`px-3 py-1 text-sm rounded-full transition-all ${
                  sortBy === 'popular'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                인기순
              </button>
              <button
                onClick={() => setSortBy('views')}
                className={`px-3 py-1 text-sm rounded-full transition-all ${
                  sortBy === 'views'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                조회수순
              </button>
            </div>

            {activeTab === 'my-posts' && (
              <div className="flex gap-2 ml-auto">
                <span className="text-sm text-gray-600 font-semibold flex items-center">
                  필터:
                </span>
                <button
                  onClick={() => setFilterBy('all')}
                  className={`px-3 py-1 text-sm rounded-full transition-all ${
                    filterBy === 'all'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  전체
                </button>
                <button
                  onClick={() => setFilterBy('public')}
                  className={`px-3 py-1 text-sm rounded-full transition-all ${
                    filterBy === 'public'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  공개
                </button>
                <button
                  onClick={() => setFilterBy('private')}
                  className={`px-3 py-1 text-sm rounded-full transition-all ${
                    filterBy === 'private'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  비공개
                </button>
              </div>
            )}
          </div>

          {/* 글 목록 */}
          {loadingPosts ? (
            <div className="text-center py-12">
              <div className="text-lg text-gray-600">로딩 중...</div>
            </div>
          ) : (
            <div className="grid gap-4">
              {(activeTab === 'my-posts' ? posts : likedPosts).length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <div className="text-gray-400 text-lg">
                    {activeTab === 'my-posts' ? '작성한 글이 없습니다.' : '좋아요한 글이 없습니다.'}
                  </div>
                </div>
              ) : (
                (activeTab === 'my-posts' ? posts : likedPosts).map((post) => (
                  <div
                    key={post.id}
                    className="relative bg-white border rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer"
                    onMouseEnter={() => setHoveredPostId(post.id)}
                    onMouseLeave={() => setHoveredPostId(null)}
                    onClick={() => navigate(`/post/${post.slug || post.id}`)}
                  >
                    {/* 카드 헤더 */}
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-bold text-gray-900 flex-1 pr-4">
                        {post.title}
                      </h3>
                      {activeTab === 'my-posts' && (
                        <div className="flex items-center gap-2">
                          {post.is_public ? (
                            <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                              <Globe className="w-3 h-3" />
                              공개
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                              <Lock className="w-3 h-3" />
                              비공개
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 메타 정보 */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(post.created_at).toLocaleDateString('ko-KR')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {post.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {post.likes_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        {post.comments_count}
                      </span>
                    </div>

                    {/* 호버 시 액션 버튼 (작성한 글만) */}
                    {activeTab === 'my-posts' && hoveredPostId === post.id && (
                      <div className="absolute top-4 right-4 flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/edit/${post.slug || post.id}`);
                          }}
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-1 text-sm font-semibold shadow-lg"
                        >
                          <Pencil className="w-4 h-4" />
                          수정
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePost(post.id);
                          }}
                          className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all flex items-center gap-1 text-sm font-semibold shadow-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                          삭제
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* 프로필 편집 모달 */}
      <ProfileEditModal
        isOpen={showProfileEdit}
        onClose={() => setShowProfileEdit(false)}
        onSuccess={handleProfileEditSuccess}
      />
    </>
  );
};
