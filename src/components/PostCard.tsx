import { Link } from 'react-router-dom';
import { getRelativeTime } from '@/utils/dateFormat';

interface PostCardProps {
  post: {
    id: string;
    title: string;
    content: string;
    thumbnail_url: string | null;
    tags: string[];
    likes_count: number;
    comments_count: number;
    views: number;
    created_at: string;
    profiles?: {
      nickname: string;
      avatar_url: string | null;
    };
  };
}

const gradients = [
  'from-blue-400 to-indigo-600',
  'from-purple-400 to-pink-600',
  'from-green-400 to-teal-600',
  'from-orange-400 to-red-600',
  'from-cyan-400 to-blue-600',
  'from-pink-400 to-rose-600',
];

export const PostCard = ({ post }: PostCardProps) => {
  // 제목으로부터 일관된 그라데이션 선택
  const gradientIndex = post.title.length % gradients.length;
  const gradient = gradients[gradientIndex];

  return (
    <Link
      to={`/post/${post.id}`}
      className="group block bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
    >
      {/* 대표 이미지 또는 그라데이션 */}
      <div className="relative h-48 overflow-hidden">
        {post.thumbnail_url ? (
          <img
            src={post.thumbnail_url}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            <div className="text-white text-6xl font-bold opacity-20">
              {post.title[0]?.toUpperCase()}
            </div>
          </div>
        )}
        
        {/* 그라데이션 오버레이 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* 카드 내용 */}
      <div className="p-5">
        {/* 제목 */}
        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {post.title}
        </h3>

        {/* 내용 미리보기 */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {post.content}
        </p>

        {/* 태그 */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
              >
                #{tag}
              </span>
            ))}
            {post.tags.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                +{post.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* 작성자 정보 & 통계 */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          {/* 작성자 */}
          <div className="flex items-center gap-2">
            {post.profiles?.avatar_url ? (
              <img
                src={post.profiles.avatar_url}
                alt={post.profiles.nickname}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-semibold">
                {(post.profiles?.nickname || '?')[0]?.toUpperCase()}
              </div>
            )}
            <div className="text-sm">
              <div className="font-medium text-gray-900">{post.profiles?.nickname || '알 수 없음'}</div>
              <div className="text-gray-500 text-xs">{getRelativeTime(post.created_at)}</div>
            </div>
          </div>

          {/* 통계 */}
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {post.likes_count}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {post.comments_count}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {post.views}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};
