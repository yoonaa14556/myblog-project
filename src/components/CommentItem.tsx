import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { CommentInput } from '@/components/CommentInput';
import { timeAgo } from '@/utils/timeAgo';
import { parseMentionContent } from '@/utils/parseMention';
import { toast } from 'sonner';
import { Heart, MessageCircle, Edit2, Trash2 } from 'lucide-react';

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

interface CommentItemProps {
  comment: Comment;
  postId: string;
  isReply?: boolean;
  onCommentUpdated: () => void;
  onCommentDeleted: () => void;
  parentCommentId?: string; // 최상위 댓글 ID (2단계 제한용)
}

export const CommentItem = ({ 
  comment, 
  postId, 
  isReply = false,
  onCommentUpdated,
  onCommentDeleted,
  parentCommentId
}: CommentItemProps) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(comment.likes_count || 0);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const isAuthor = user?.id === comment.user_id;

  // 좋아요 상태 확인
  useEffect(() => {
    const checkIfLiked = async () => {
      if (!user) return;

      try {
        const { data } = await supabase
          .from('comment_likes')
          .select('id')
          .eq('comment_id', comment.id)
          .eq('user_id', user.id)
          .maybeSingle();

        setIsLiked(!!data);
      } catch (error) {
        console.error('좋아요 상태 확인 실패:', error);
      }
    };

    checkIfLiked();
  }, [user, comment.id]);

  const handleLike = async () => {
    if (!user) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    try {
      if (isLiked) {
        // 좋아요 취소
        await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', comment.id)
          .eq('user_id', user.id);

        setIsLiked(false);
        setLikesCount(prev => prev - 1);
      } else {
        // 좋아요 추가
        await supabase
          .from('comment_likes')
          .insert([{ comment_id: comment.id, user_id: user.id }]);

        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      }
    } catch (error: any) {
      console.error('좋아요 처리 실패:', error);
      toast.error('좋아요 처리에 실패했습니다.');
    }
  };

  const handleUpdate = async () => {
    if (!editContent.trim()) {
      toast.error('댓글 내용을 입력해주세요.');
      return;
    }

    if (editContent.length > 1000) {
      toast.error('댓글은 최대 1000자까지 입력 가능합니다.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('comments')
        .update({ 
          content: editContent.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', comment.id);

      if (error) throw error;

      toast.success('댓글이 수정되었습니다.');
      setIsEditing(false);
      onCommentUpdated();
    } catch (error: any) {
      console.error('댓글 수정 실패:', error);
      toast.error('댓글 수정에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      // Soft delete: deleted_at 타임스탬프 설정
      const { error } = await supabase
        .from('comments')
        .update({ 
          deleted_at: new Date().toISOString()
        })
        .eq('id', comment.id);

      if (error) throw error;

      toast.success('댓글이 삭제되었습니다.');
      onCommentDeleted();
    } catch (error: any) {
      console.error('댓글 삭제 실패:', error);
      toast.error('댓글 삭제에 실패했습니다.');
    }
  };

  // 삭제된 댓글 표시
  const isDeleted = !!comment.deleted_at;

  return (
    <div className={`${isReply ? 'ml-8 pl-4 border-l-2 border-blue-200 bg-blue-50/30' : ''} transition-colors`}>
      <div className="flex gap-3 py-4">
        {/* 답글 표시 아이콘 */}
        {isReply && (
          <div className="flex-shrink-0 w-6 flex items-start pt-1">
            <MessageCircle className="w-4 h-4 text-blue-400" />
          </div>
        )}
        
        {/* 프로필 사진 */}
        {comment.profiles?.avatar_url ? (
          <img
            src={comment.profiles.avatar_url}
            alt={comment.profiles.nickname}
            className={`w-10 h-10 rounded-full object-cover flex-shrink-0 ${isDeleted ? 'opacity-50' : ''}`}
          />
        ) : (
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 ${isDeleted ? 'opacity-50' : ''}`}>
            {(comment.profiles?.nickname || '?')[0]?.toUpperCase()}
          </div>
        )}

        {/* 댓글 내용 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`font-semibold ${isDeleted ? 'text-gray-400' : 'text-gray-900'}`}>
              {comment.profiles?.nickname || '알 수 없음'}
            </span>
            <span className="text-sm text-gray-500">
              {timeAgo(comment.created_at)}
            </span>
            {!isDeleted && comment.created_at !== comment.updated_at && (
              <span className="text-xs text-gray-400">(수정됨)</span>
            )}
            {isDeleted && (
              <span className="text-xs text-red-400">(삭제됨)</span>
            )}
          </div>

          {isDeleted ? (
            // 삭제된 댓글
            <p className="text-gray-400 italic py-2">
              삭제된 댓글입니다
            </p>
          ) : isEditing ? (
            // 수정 모드
            <div className="mt-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[80px]"
                disabled={isSubmitting}
              />
              <div className="flex items-center gap-2 mt-2">
                <Button
                  onClick={handleUpdate}
                  disabled={isSubmitting || !editContent.trim()}
                  size="sm"
                >
                  {isSubmitting ? '저장 중...' : '저장'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
                  disabled={isSubmitting}
                  size="sm"
                >
                  취소
                </Button>
                <span className="text-sm text-gray-500 ml-2">
                  {editContent.length} / 1000
                </span>
              </div>
            </div>
          ) : (
            // 일반 모드
            <>
              <p className="text-gray-800 whitespace-pre-wrap break-words">
                {parseMentionContent(comment.content).map((part, index) => {
                  if (typeof part === 'string') {
                    return <span key={index}>{part}</span>;
                  }
                  return (
                    <span
                      key={index}
                      className="text-blue-600 font-semibold hover:underline cursor-pointer"
                    >
                      @{part.nickname}
                    </span>
                  );
                })}
              </p>

              {/* 액션 버튼들 */}
              <div className="flex items-center gap-4 mt-2">
                {/* 좋아요 */}
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-1 text-sm transition-colors ${
                    isLiked 
                      ? 'text-red-500 font-semibold' 
                      : 'text-gray-500 hover:text-red-500'
                  }`}
                  disabled={!user}
                >
                  <Heart 
                    size={16} 
                    fill={isLiked ? 'currentColor' : 'none'}
                  />
                  <span>{likesCount > 0 ? likesCount : ''}</span>
                </button>

                {/* 답글 버튼 */}
                <button
                  onClick={() => setShowReplyInput(!showReplyInput)}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-500 transition-colors"
                  disabled={!user}
                >
                  <MessageCircle size={16} />
                  <span>답글</span>
                </button>

                {/* 수정/삭제 (작성자만) */}
                {isAuthor && (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-500 transition-colors"
                    >
                      <Edit2 size={14} />
                      <span>수정</span>
                    </button>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                      <span>삭제</span>
                    </button>
                  </>
                )}
              </div>
            </>
          )}

          {/* 답글 입력창 (삭제된 댓글은 답글 불가) */}
          {showReplyInput && !isDeleted && (
            <div className="mt-4">
              <CommentInput
                postId={postId}
                parentId={parentCommentId || comment.id}
                onCommentAdded={() => {
                  setShowReplyInput(false);
                  onCommentUpdated();
                }}
                onCancel={() => setShowReplyInput(false)}
                placeholder={`@${comment.profiles?.nickname || '사용자'}님에게 답글...`}
                initialContent={`@${comment.profiles?.nickname || '사용자'} `}
                replyToNickname={comment.profiles?.nickname}
                autoFocus
              />
            </div>
          )}
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-xl font-bold mb-4">댓글 삭제</h3>
            <p className="text-gray-600 mb-2">정말 삭제하시겠습니까?</p>
            <p className="text-sm text-gray-500 mb-6">
              댓글은 "삭제된 댓글입니다"로 표시됩니다.
            </p>
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
    </div>
  );
};
