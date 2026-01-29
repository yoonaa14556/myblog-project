import { useState, type FormEvent, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast, Toaster } from 'sonner';
import { generateSlug, parseTags } from '@/utils/slugify';

interface Post {
  id: string;
  title: string;
  content: string;
  tags: string[];
  is_public: boolean;
  slug: string | null;
  author_id: string;
}

export const EditPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [post, setPost] = useState<Post | null>(null);
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [slug, setSlug] = useState('');

  useEffect(() => {
    if (id && user) {
      fetchPost();
    }
  }, [id, user]);

  // 제목이 변경될 때마다 slug 자동 생성
  useEffect(() => {
    if (title && title !== post?.title) {
      const generatedSlug = generateSlug(title);
      setSlug(generatedSlug);
    }
  }, [title, post?.title]);

  const fetchPost = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // 권한 확인: 작성자만 수정 가능
      if (data.author_id !== user?.id) {
        toast.error('권한이 없습니다.');
        navigate('/');
        return;
      }

      setPost(data);
      setTitle(data.title);
      setContent(data.content);
      setTagsInput(data.tags ? data.tags.join(', ') : '');
      setIsPublic(data.is_public);
      setSlug(data.slug || '');
    } catch (error) {
      console.error('게시글 로딩 실패:', error);
      toast.error('게시글을 불러오는데 실패했습니다.');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    if (!title.trim() || !content.trim()) {
      toast.error('제목과 내용을 모두 입력해주세요.');
      return;
    }

    const tags = parseTags(tagsInput);
    
    if (tagsInput && tags.length === 0) {
      toast.error('올바른 태그 형식을 입력해주세요.');
      return;
    }

    setSaving(true);

    try {
      // slug 중복 확인 (자신의 글 제외)
      if (slug && slug !== post?.slug) {
        const { data: existingPost } = await supabase
          .from('posts')
          .select('id')
          .eq('slug', slug)
          .neq('id', id)
          .maybeSingle();

        if (existingPost) {
          // slug가 중복되면 랜덤 문자열 추가
          const randomSuffix = Math.random().toString(36).substring(2, 8);
          setSlug(`${slug}-${randomSuffix}`);
        }
      }

      const { error } = await supabase
        .from('posts')
        .update({
          title: title.trim(),
          content: content.trim(),
          tags,
          is_public: isPublic,
          slug: slug || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('게시글이 수정되었습니다!');
      setTimeout(() => {
        navigate(`/post/${id}`);
      }, 800);
    } catch (error: any) {
      console.error('게시글 수정 실패:', error);
      toast.error(error.message || '게시글 수정에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (
      title !== post?.title ||
      content !== post?.content ||
      tagsInput !== (post?.tags || []).join(', ')
    ) {
      if (window.confirm('수정 중인 내용이 있습니다. 정말로 취소하시겠습니까?')) {
        navigate(`/post/${id}`);
      }
    } else {
      navigate(`/post/${id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">로딩 중...</div>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  const tags = parseTags(tagsInput);
  const tagCount = tags.length;

  return (
    <>
      <Toaster position="top-center" richColors />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* 헤더 */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">글 수정</h1>
            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
                disabled={saving}
              >
                취소
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={saving || !title.trim() || !content.trim()}
              >
                {saving ? '저장 중...' : '저장하기'}
              </Button>
            </div>
          </div>

          {/* 설정 옵션 */}
          <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <label htmlFor="isPublic" className="text-sm font-medium text-gray-700">
                  공개 설정
                </label>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isPublic}
                  onClick={() => setIsPublic(!isPublic)}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                    ${isPublic ? 'bg-blue-600' : 'bg-gray-300'}
                  `}
                >
                  <span
                    className={`
                      inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                      ${isPublic ? 'translate-x-6' : 'translate-x-1'}
                    `}
                  />
                </button>
                <span className="text-sm text-gray-600">
                  {isPublic ? '공개' : '비공개'}
                </span>
              </div>

              {/* URL Slug 미리보기 */}
              {slug && (
                <div className="text-sm text-gray-500">
                  URL: <span className="font-mono text-blue-600">/{slug}</span>
                </div>
              )}
            </div>
          </div>

          {/* 작성 폼 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 제목 */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-4xl font-bold border-none focus:outline-none focus:ring-0 placeholder-gray-300"
                placeholder="제목을 입력하세요"
                required
              />
            </div>

            {/* 태그 입력 */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                태그 <span className="text-xs text-gray-500">(쉼표로 구분, 최대 5개 - {tagCount}/5)</span>
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="예: React, TypeScript, 블로그"
              />
              
              {/* 태그 미리보기 */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              
              {tagCount > 5 && (
                <p className="text-sm text-red-500 mt-2">
                  태그는 최대 5개까지 입력할 수 있습니다.
                </p>
              )}
            </div>

            {/* 내용 에디터 */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                내용
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[500px] resize-y"
                placeholder="당신의 이야기를 들려주세요..."
                required
              />
              <div className="text-sm text-gray-500 mt-2">
                {content.length} 글자
              </div>
            </div>

            {/* 하단 버튼 (모바일용) */}
            <div className="flex gap-3 sm:hidden">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
                className="flex-1"
                disabled={saving}
              >
                취소
              </Button>
              <Button 
                type="submit"
                className="flex-1"
                disabled={saving || !title.trim() || !content.trim()}
              >
                {saving ? '저장 중...' : '저장하기'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
