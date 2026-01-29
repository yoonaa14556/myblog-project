/**
 * 댓글 내용에서 @멘션을 파싱하여 스타일이 적용된 요소로 변환
 * @param content - 댓글 내용
 * @returns React 요소
 */
export const parseMentionContent = (content: string) => {
  // @닉네임 패턴 매칭 (공백이나 줄바꿈 전까지)
  const mentionPattern = /@(\S+)/g;
  const parts: (string | { type: 'mention'; nickname: string })[] = [];
  let lastIndex = 0;

  content.replace(mentionPattern, (match, nickname, offset) => {
    // 매칭 전 텍스트 추가
    if (offset > lastIndex) {
      parts.push(content.substring(lastIndex, offset));
    }
    
    // 멘션 추가
    parts.push({ type: 'mention', nickname });
    lastIndex = offset + match.length;
    
    return match;
  });

  // 남은 텍스트 추가
  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex));
  }

  return parts.length > 0 ? parts : [content];
};
