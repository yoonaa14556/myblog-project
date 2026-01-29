# 프로필 정보 사용 가이드

어디서든 현재 로그인한 사용자의 프로필 정보를 사용할 수 있습니다.

## 프로필 정보 가져오기

```tsx
import { useAuth } from '@/contexts/AuthContext';

function YourComponent() {
  const { user, profile } = useAuth();
  
  // user: Supabase 사용자 객체
  // profile: 프로필 정보 (nickname, bio, avatar_url 등)
  
  return (
    <div>
      {profile && (
        <>
          <p>닉네임: {profile.nickname}</p>
          <p>이메일: {profile.email}</p>
          <p>자기소개: {profile.bio}</p>
          
          {/* 프로필 이미지 */}
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.nickname} />
          ) : (
            <div>{profile.nickname[0].toUpperCase()}</div>
          )}
        </>
      )}
    </div>
  );
}
```

## Profile 타입

```tsx
interface Profile {
  id: string;              // 사용자 ID
  email: string;           // 이메일
  nickname: string;        // 닉네임
  bio: string | null;      // 자기소개 (선택)
  avatar_url: string | null; // 프로필 이미지 URL (선택)
  created_at: string;      // 가입일
}
```

## 프로필 새로고침

프로필 정보를 업데이트한 후 새로고침이 필요하면:

```tsx
const { refreshProfile } = useAuth();

// 프로필 업데이트 후
await refreshProfile();
```

## 예시: 댓글 컴포넌트

```tsx
function Comment() {
  const { profile } = useAuth();
  
  return (
    <div className="flex gap-3">
      {/* 프로필 이미지 */}
      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} className="rounded-full" />
        ) : (
          profile?.nickname[0].toUpperCase()
        )}
      </div>
      
      {/* 닉네임 */}
      <div>
        <p className="font-semibold">{profile?.nickname}</p>
        <p>댓글 내용...</p>
      </div>
    </div>
  );
}
```
