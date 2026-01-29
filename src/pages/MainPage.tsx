import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { PostCard } from '@/components/PostCard';
import { PostCardSkeleton } from '@/components/PostCardSkeleton';
import { useAuth } from '@/contexts/AuthContext';

interface Post {
  id: string;
  title: string;
  content: string;
  created_at: string;
  author_id: string;
  tags: string[];
  is_public: boolean;
  slug: string | null;
  thumbnail_url: string | null;
  likes_count: number;
  comments_count: number;
  views: number;
  profiles?: {
    nickname: string;
    avatar_url: string | null;
  };
}

type SortOption = 'latest' | 'popular';

const POSTS_PER_PAGE = 12;

export const MainPage = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [page, setPage] = useState(0);
  const observerTarget = useRef<HTMLDivElement>(null);

  // 게시글 가져오기
  const fetchPosts = useCallback(async (pageNum: number, sort: SortOption, reset: boolean = false) => {
    try {
      if (pageNum === 0) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      let query = supabase
        .from('posts')
        .select('*')
        .eq('is_public', true)
        .range(pageNum * POSTS_PER_PAGE, (pageNum + 1) * POSTS_PER_PAGE - 1);

      // 정렬
      if (sort === 'latest') {
        query = query.order('created_at', { ascending: false });
      } else {
        // 인기순: likes + comments 많은 순, 같으면 최신순
        query = query
          .order('likes_count', { ascending: false })
          .order('comments_count', { ascending: false })
          .order('created_at', { ascending: false });
      }

      const { data: postsData, error } = await query;

      if (error) throw error;

      // 작성자 프로필 정보 가져오기
      const authorIds = [...new Set(postsData?.map(post => post.author_id) || [])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, nickname, avatar_url')
        .in('id', authorIds);

      // profiles를 맵으로 변환
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      // posts에 profiles 정보 추가
      const newPosts = (postsData || []).map(post => ({
        ...post,
        profiles: profilesMap.get(post.author_id) || { nickname: '알 수 없음', avatar_url: null }
      })) as Post[];
      
      if (reset) {
        setPosts(newPosts);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
      }

      setHasMore(newPosts.length === POSTS_PER_PAGE);
    } catch (error: any) {
      // AbortError 무시 (React StrictMode에서 정상적인 동작)
      if (error?.name !== 'AbortError') {
        console.error('게시글 로딩 실패:', error);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // 초기 로딩
  useEffect(() => {
    fetchPosts(0, sortBy, true);
    setPage(0);
  }, [sortBy, fetchPosts]);

  // 무한 스크롤
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchPosts(nextPage, sortBy, false);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading, loadingMore, page, sortBy, fetchPosts]);

  // 정렬 변경
  const handleSortChange = (newSort: SortOption) => {
    if (newSort !== sortBy) {
      setSortBy(newSort);
      setPosts([]);
      setPage(0);
      setHasMore(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">블로그 포스트</h1>
            <p className="text-gray-600">다양한 이야기를 만나보세요</p>
          </div>

          {/* 정렬 옵션 */}
          <div className="flex gap-2">
            <button
              onClick={() => handleSortChange('latest')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                sortBy === 'latest'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              최신순
            </button>
            <button
              onClick={() => handleSortChange('popular')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                sortBy === 'popular'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              인기순
            </button>
          </div>
        </div>

        {/* 게시글 그리드 */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <PostCardSkeleton key={i} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📝</div>
            <p className="text-xl text-gray-500 mb-4">아직 작성된 글이 없습니다.</p>
            {user && (
              <Button asChild>
                <Link to="/write">첫 글 작성하기</Link>
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>

            {/* 더 불러오기 인디케이터 */}
            {loadingMore && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                {[...Array(3)].map((_, i) => (
                  <PostCardSkeleton key={i} />
                ))}
              </div>
            )}

            {/* 무한 스크롤 트리거 */}
            <div ref={observerTarget} className="h-10" />

            {/* 더 이상 없음 */}
            {!hasMore && posts.length > 0 && (
              <div className="text-center py-10">
                <p className="text-gray-500">모든 게시글을 불러왔습니다.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
