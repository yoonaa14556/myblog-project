import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CommentInput } from '@/components/CommentInput';
import { CommentItem } from '@/components/CommentItem';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  likes_count: number;
  user_id: string;
  parent_id: string | null;
  profiles?: {
    nickname: string;
    avatar_url: string | null;
  };
}

interface CommentSectionProps {
  postId: string;
}

const PAGE_SIZE = 20;

export const CommentSection = ({ postId }: CommentSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchComments(1);
  }, [postId]);

  const fetchComments = async (pageNum: number, append = false) => {
    try {
      setLoading(true);

      // 총 댓글 수 가져오기
      const { count } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

      setTotalCount(count || 0);

      // 댓글 가져오기 (최신순, 페이지네이션)
      const from = (pageNum - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data: commentsData, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      // 각 댓글의 작성자 프로필 정보 가져오기
      const userIds = [...new Set(commentsData?.map(c => c.user_id) || [])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, nickname, avatar_url')
        .in('id', userIds);

      // 프로필 정보를 매핑
      const profilesMap = new Map(
        profilesData?.map(p => [p.id, p]) || []
      );

      const commentsWithProfiles = (commentsData || []).map(comment => ({
        ...comment,
        profiles: profilesMap.get(comment.user_id) || {
          nickname: '알 수 없음',
          avatar_url: null,
        },
      }));

      if (append) {
        setComments(prev => [...prev, ...commentsWithProfiles]);
      } else {
        setComments(commentsWithProfiles);
      }

      setPage(pageNum);
      setHasMore((count || 0) > pageNum * PAGE_SIZE);
    } catch (error) {
      console.error('댓글 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    fetchComments(page + 1, true);
  };

  const handleCommentAdded = () => {
    // 댓글 추가 시 첫 페이지부터 다시 로드
    fetchComments(1);
  };

  const handleCommentUpdated = () => {
    // 댓글 수정/답글 추가 시 현재까지 로드된 페이지 다시 로드
    fetchComments(page);
  };

  const handleCommentDeleted = () => {
    // 댓글 삭제 시 현재까지 로드된 페이지 다시 로드
    fetchComments(page);
  };

  // 댓글과 답글을 그룹화
  const topLevelComments = comments.filter(c => !c.parent_id);
  const repliesMap = new Map<string, Comment[]>();
  
  comments.forEach(comment => {
    if (comment.parent_id) {
      if (!repliesMap.has(comment.parent_id)) {
        repliesMap.set(comment.parent_id, []);
      }
      repliesMap.get(comment.parent_id)!.push(comment);
    }
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border p-8 mt-8">
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="w-6 h-6 text-gray-700" />
        <h2 className="text-2xl font-bold text-gray-900">
          댓글 {totalCount > 0 ? `(${totalCount})` : ''}
        </h2>
      </div>

      {/* 댓글 입력 */}
      <div className="mb-8">
        <CommentInput
          postId={postId}
          onCommentAdded={handleCommentAdded}
        />
      </div>

      {/* 댓글 목록 */}
      {loading && comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          댓글을 불러오는 중...
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {topLevelComments.map(comment => (
            <div key={comment.id}>
              {/* 부모 댓글 */}
              <CommentItem
                comment={comment}
                postId={postId}
                onCommentUpdated={handleCommentUpdated}
                onCommentDeleted={handleCommentDeleted}
              />
              
              {/* 답글들 */}
              {repliesMap.has(comment.id) && (
                <div>
                  {repliesMap.get(comment.id)!
                    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                    .map(reply => (
                      <CommentItem
                        key={reply.id}
                        comment={reply}
                        postId={postId}
                        isReply
                        onCommentUpdated={handleCommentUpdated}
                        onCommentDeleted={handleCommentDeleted}
                        parentCommentId={comment.id}
                      />
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 더보기 버튼 */}
      {hasMore && (
        <div className="mt-8 text-center">
          <Button
            onClick={handleLoadMore}
            variant="outline"
            disabled={loading}
            className="px-8"
          >
            {loading ? '불러오는 중...' : `댓글 더보기 (${totalCount - comments.length}개 남음)`}
          </Button>
        </div>
      )}
    </div>
  );
};
