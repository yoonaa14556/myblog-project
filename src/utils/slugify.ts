/**
 * 제목을 URL-friendly한 slug로 변환
 * @param title 게시글 제목
 * @returns URL slug
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    // 특수문자 제거 (한글, 영문, 숫자, 공백, 하이픈만 허용)
    .replace(/[^\w\s가-힣-]/g, '')
    // 공백을 하이픈으로 변경
    .replace(/\s+/g, '-')
    // 연속된 하이픈을 하나로
    .replace(/-+/g, '-')
    // 앞뒤 하이픈 제거
    .replace(/^-+|-+$/g, '')
    // 최대 길이 제한 (50자)
    .slice(0, 50);
}

/**
 * 태그 문자열을 배열로 변환
 * @param tagsInput 쉼표로 구분된 태그 문자열
 * @returns 태그 배열 (최대 5개)
 */
export function parseTags(tagsInput: string): string[] {
  return tagsInput
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0)
    .slice(0, 5); // 최대 5개
}
