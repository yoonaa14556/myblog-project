export const PostCardSkeleton = () => {
  return (
    <div className="block bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 animate-pulse">
      {/* 이미지 스켈레톤 */}
      <div className="h-48 bg-gray-200" />

      {/* 내용 스켈레톤 */}
      <div className="p-5">
        {/* 제목 */}
        <div className="h-6 bg-gray-200 rounded mb-2" />
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />

        {/* 내용 미리보기 */}
        <div className="space-y-2 mb-4">
          <div className="h-4 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
        </div>

        {/* 태그 */}
        <div className="flex gap-2 mb-4">
          <div className="h-6 w-16 bg-gray-200 rounded-full" />
          <div className="h-6 w-20 bg-gray-200 rounded-full" />
          <div className="h-6 w-14 bg-gray-200 rounded-full" />
        </div>

        {/* 하단 */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full" />
            <div className="space-y-1">
              <div className="h-4 w-20 bg-gray-200 rounded" />
              <div className="h-3 w-16 bg-gray-200 rounded" />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="h-4 w-8 bg-gray-200 rounded" />
            <div className="h-4 w-8 bg-gray-200 rounded" />
            <div className="h-4 w-8 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
};
