import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { highlightText } from '@/utils/highlightText';
import { timeAgo } from '@/utils/timeAgo';
import { FileText, User, Search as SearchIcon } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  content: string;
  created_at: string;
  author_id: string;
  views: number;
  likes_count: number;
  profiles?: {
    nickname: string;
    avatar_url: string | null;
  };
}

interface Profile {
  id: string;
  nickname: string;
  bio: string | null;
  avatar_url: string | null;
}

export const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [posts, setPosts] = useState<Post[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (query) {
      performSearch(query);
    } else {
      setLoading(false);
    }
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);

    try {
      // 글 검색 (제목 또는 내용에 검색어 포함)
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('is_public', true)
        .or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (postsError) throw postsError;

      // 작성자 프로필 정보 가져오기
      if (postsData && postsData.length > 0) {
        const authorIds = [...new Set(postsData.map(post => post.author_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, nickname, avatar_url')
          .in('id', authorIds);

        const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
        const postsWithProfiles = postsData.map(post => ({
          ...post,
          profiles: profilesMap.get(post.author_id) || { nickname: '알 수 없음', avatar_url: null },
        }));

        setPosts(postsWithProfiles);
      } else {
        setPosts([]);
      }

      // 작성자 검색 (닉네임에 검색어 포함)
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, nickname, bio, avatar_url')
        .ilike('nickname', `%${searchQuery}%`)
        .limit(10);

      if (profilesError) throw profilesError;

      setProfiles(profilesData || []);
    } catch (error) {
      console.error('검색 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!query) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <SearchIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-700 mb-2">검색어를 입력해주세요</h2>
        <p className="text-gray-500">상단 검색창을 이용해 글이나 작성자를 검색할 수 있습니다.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="text-xl text-gray-600">검색 중...</div>
      </div>
    );
  }

  const totalResults = posts.length + profiles.length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* 검색 결과 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          검색 결과
        </h1>
        <p className="text-gray-600">
          '<span className="font-semibold text-blue-600">{query}</span>'에 대한 검색 결과 {totalResults}개
        </p>
      </div>

      {totalResults === 0 ? (
        <div className="text-center py-16">
          <SearchIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">검색 결과가 없습니다</h2>
          <p className="text-gray-500">다른 검색어로 다시 시도해보세요.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* 글 결과 */}
          {posts.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-blue-500">
                <FileText className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">
                  글 ({posts.length})
                </h2>
              </div>

              <div className="space-y-4">
                {posts.map(post => (
                  <Link
                    key={post.id}
                    to={`/post/${post.id}`}
                    className="block bg-white rounded-lg border p-5 hover:shadow-md transition-shadow"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {highlightText(post.title, query).map((part, index) => {
                        if (typeof part === 'string') {
                          return <span key={index}>{part}</span>;
                        }
                        return (
                          <mark
                            key={index}
                            className="bg-yellow-200 text-gray-900 px-1 rounded"
                          >
                            {part.text}
                          </mark>
                        );
                      })}
                    </h3>

                    <p className="text-gray-600 mb-3 line-clamp-2">
                      {highlightText(post.content.substring(0, 200), query).map((part, index) => {
                        if (typeof part === 'string') {
                          return <span key={index}>{part}</span>;
                        }
                        return (
                          <mark
                            key={index}
                            className="bg-yellow-200 text-gray-900 px-1 rounded"
                          >
                            {part.text}
                          </mark>
                        );
                      })}
                      {post.content.length > 200 && '...'}
                    </p>

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          {post.profiles?.avatar_url ? (
                            <img
                              src={post.profiles.avatar_url}
                              alt={post.profiles.nickname}
                              className="w-5 h-5 rounded-full"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-semibold">
                              {post.profiles?.nickname?.[0]?.toUpperCase() || 'U'}
                            </div>
                          )}
                          {post.profiles?.nickname}
                        </span>
                        <span>·</span>
                        <span>{timeAgo(post.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span>👁️ {post.views}</span>
                        <span>❤️ {post.likes_count}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* 작성자 결과 */}
          {profiles.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-green-500">
                <User className="w-5 h-5 text-green-600" />
                <h2 className="text-xl font-bold text-gray-900">
                  작성자 ({profiles.length})
                </h2>
              </div>

              <div className="space-y-3">
                {profiles.map(profile => (
                  <div
                    key={profile.id}
                    className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      {profile.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt={profile.nickname}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center text-white text-lg font-semibold">
                          {profile.nickname[0]?.toUpperCase() || 'U'}
                        </div>
                      )}

                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {highlightText(profile.nickname, query).map((part, index) => {
                            if (typeof part === 'string') {
                              return <span key={index}>{part}</span>;
                            }
                            return (
                              <mark
                                key={index}
                                className="bg-yellow-200 text-gray-900 px-1 rounded"
                              >
                                {part.text}
                              </mark>
                            );
                          })}
                        </h3>
                        {profile.bio && (
                          <p className="text-sm text-gray-600 mt-1">{profile.bio}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};
