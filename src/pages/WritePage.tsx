import { useState, type FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast, Toaster } from 'sonner';
import { generateSlug, parseTags } from '@/utils/slugify';
import { ImageUpload } from '@/components/ImageUpload';

export const WritePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [slug, setSlug] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [loading, setLoading] = useState(false);

  // 제목이 변경될 때마다 slug 자동 생성
  useEffect(() => {
    if (title) {
      const generatedSlug = generateSlug(title);
      setSlug(generatedSlug);
    }
  }, [title]);

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

    setLoading(true);

    try {
      // slug 중복 확인
      if (slug) {
        const { data: existingPost } = await supabase
          .from('posts')
          .select('id')
          .eq('slug', slug)
          .single();

        if (existingPost) {
          // slug가 중복되면 랜덤 문자열 추가
          const randomSuffix = Math.random().toString(36).substring(2, 8);
          const newSlug = `${slug}-${randomSuffix}`;
          setSlug(newSlug);
        }
      }

      const { data, error } = await supabase
        .from('posts')
        .insert([
          {
            title: title.trim(),
            content: content.trim(),
            author_id: user.id,
            tags,
            is_public: isPublic,
            slug: slug || null,
            thumbnail_url: thumbnailUrl || null,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      toast.success('게시글이 발행되었습니다!');
      setTimeout(() => {
        navigate(`/post/${data.id}`);
      }, 800);
    } catch (error: any) {
      // AbortError 무시 (React StrictMode에서 정상적인 동작)
      if (error?.name === 'AbortError') {
        return;
      }
      console.error('게시글 작성 실패:', error);
      toast.error(error.message || '게시글 작성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (title || content) {
      if (window.confirm('작성 중인 내용이 있습니다. 정말로 취소하시겠습니까?')) {
        navigate('/');
      }
    } else {
      navigate('/');
    }
  };

  const tags = parseTags(tagsInput);
  const tagCount = tags.length;

  return (
    <>
      <Toaster position="top-center" richColors />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* 헤더 */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">새 글 작성</h1>
            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
                disabled={loading}
              >
                취소
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={loading || !title.trim() || !content.trim()}
              >
                {loading ? '발행 중...' : '발행하기'}
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

            {/* 대표 이미지 업로드 */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <ImageUpload 
                onImageUploaded={setThumbnailUrl}
                currentImageUrl={thumbnailUrl}
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
                disabled={loading}
              >
                취소
              </Button>
              <Button 
                type="submit"
                className="flex-1"
                disabled={loading || !title.trim() || !content.trim()}
              >
                {loading ? '발행 중...' : '발행하기'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
