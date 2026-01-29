import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface CommentInputProps {
  postId: string;
  parentId?: string;
  onCommentAdded: () => void;
  onCancel?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  initialContent?: string;
  replyToNickname?: string;
}

const MAX_LENGTH = 1000;

export const CommentInput = ({ 
  postId, 
  parentId, 
  onCommentAdded, 
  onCancel,
  placeholder = '댓글을 작성하세요...',
  autoFocus = false,
  initialContent = ''
}: CommentInputProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState(initialContent);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Textarea 자동 크기 조절
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content]);

  // Auto focus
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = async () => {
    if (!user) {
      toast.error('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    if (!content.trim()) {
      toast.error('댓글 내용을 입력해주세요.');
      return;
    }

    if (content.length > MAX_LENGTH) {
      toast.error(`댓글은 최대 ${MAX_LENGTH}자까지 입력 가능합니다.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('comments')
        .insert([
          {
            post_id: postId,
            user_id: user.id,
            content: content.trim(),
            parent_id: parentId || null,
          },
        ]);

      if (error) throw error;

      toast.success(parentId ? '답글이 작성되었습니다.' : '댓글이 작성되었습니다.');
      setContent('');
      onCommentAdded();
    } catch (error: any) {
      console.error('댓글 작성 실패:', error);
      toast.error(error.message || '댓글 작성에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl + Enter로 제출
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // 로그인하지 않은 경우
  if (!user) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center border border-gray-200">
        <p className="text-gray-600 mb-4">댓글을 쓰려면 로그인하세요</p>
        <Button onClick={() => navigate('/login')}>
          로그인
        </Button>
      </div>
    );
  }

  const remainingChars = MAX_LENGTH - content.length;
  const isOverLimit = remainingChars < 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[100px] ${
          isOverLimit ? 'border-red-500' : ''
        }`}
        disabled={isSubmitting}
      />
      
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          <span className={`text-sm ${isOverLimit ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>
            {content.length} / {MAX_LENGTH}
          </span>
          <span className="text-xs text-gray-400">
            (Ctrl + Enter로 제출)
          </span>
        </div>
        
        <div className="flex gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              size="sm"
            >
              취소
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !content.trim() || isOverLimit}
            size="sm"
          >
            {isSubmitting ? '작성 중...' : parentId ? '답글 작성' : '댓글 작성'}
          </Button>
        </div>
      </div>
    </div>
  );
};
