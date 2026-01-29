/**
 * 텍스트에서 검색어를 찾아 하이라이트 처리
 * @param text - 원본 텍스트
 * @param query - 검색어
 * @returns React 요소 배열
 */
export const highlightText = (text: string, query: string) => {
  if (!query.trim()) return [text];

  const parts: (string | { type: 'highlight'; text: string })[] = [];
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  let lastIndex = 0;

  text.replace(regex, (match, _p1, offset) => {
    // 매칭 전 텍스트 추가
    if (offset > lastIndex) {
      parts.push(text.substring(lastIndex, offset));
    }
    
    // 하이라이트된 텍스트 추가
    parts.push({ type: 'highlight', text: match });
    lastIndex = offset + match.length;
    
    return match;
  });

  // 남은 텍스트 추가
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
};
