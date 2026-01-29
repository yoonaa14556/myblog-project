# MyBlog 프로젝트 AI 에이전트 규칙

이 문서는 MyBlog 프로젝트에서 AI 어시스턴트가 따라야 할 규칙과 가이드라인을 정의합니다.

## 기술 스택

- **프레임워크**: React 19 + TypeScript
- **빌드 도구**: Vite
- **스타일링**: Tailwind CSS 4
- **UI 컴포넌트**: shadcn/ui (New York 스타일)
- **아이콘**: lucide-react

## 디자인 및 UI 개발 규칙

### 1. shadcn/ui 적극 활용

- **모든 UI 컴포넌트는 shadcn/ui를 우선적으로 사용**합니다
- 커스텀 컴포넌트가 필요한 경우, shadcn/ui 컴포넌트를 확장하여 사용합니다
- 버튼, 입력 필드, 카드, 다이얼로그 등 일반적인 UI 요소는 반드시 shadcn/ui 컴포넌트를 활용합니다

### 2. 컴포넌트 추가 방법

**shadcn/ui 컴포넌트를 추가할 때는 반드시 터미널 명령어를 사용합니다:**

```bash
# 단일 컴포넌트 추가
npx shadcn@latest add <component-name>

# 예시
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu

# 여러 컴포넌트 동시 추가
npx shadcn@latest add card input button dialog
```

**직접 파일을 생성하거나 복사하지 않고, 항상 CLI를 통해 추가합니다.**

### 3. 스타일링 원칙

- Tailwind CSS 유틸리티 클래스를 사용합니다
- `cn()` 유틸리티 함수를 사용하여 조건부 클래스를 관리합니다
- CSS 변수를 활용한 테마 시스템을 유지합니다
- 커스텀 CSS는 최소화하고, Tailwind 클래스를 우선 사용합니다

### 4. 컴포넌트 구조

```
src/
  components/
    ui/                    # shadcn/ui 컴포넌트 (자동 생성)
      button.tsx
      card.tsx
      ...
    <feature>/            # 기능별 커스텀 컴포넌트
      ComponentName.tsx
```

## 개발 워크플로우

### 새로운 기능 추가 시

1. **필요한 shadcn/ui 컴포넌트 확인**
2. **터미널에서 컴포넌트 추가**: `npx shadcn@latest add <component-name>`
3. **커스텀 컴포넌트 개발** (필요한 경우 shadcn/ui 컴포넌트를 조합)
4. **타입 안정성 확보** (TypeScript 타입 정의)

### UI 수정 시

1. 먼저 shadcn/ui에서 제공하는 컴포넌트가 있는지 확인
2. 있다면 해당 컴포넌트를 추가하여 사용
3. 없다면 기존 shadcn/ui 컴포넌트를 조합하여 구현

## 코드 작성 규칙

### 컴포넌트 작성

```typescript
// shadcn/ui 컴포넌트 import
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

// 타입 정의
interface MyComponentProps {
  title: string
  onAction: () => void
}

// 컴포넌트 구현
export function MyComponent({ title, onAction }: MyComponentProps) {
  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <Button onClick={onAction}>실행</Button>
    </Card>
  )
}
```

### 스타일링

```typescript
import { cn } from "@/lib/utils"

// 조건부 스타일링
<div className={cn(
  "base-class",
  condition && "conditional-class",
  variant === "primary" && "primary-class"
)}>
```

## 금지 사항

❌ **하지 말아야 할 것:**

1. shadcn/ui 컴포넌트를 수동으로 복사하여 추가
2. 이미 shadcn/ui에 존재하는 컴포넌트를 처음부터 새로 작성
3. Inline 스타일이나 styled-components 사용
4. 불필요한 커스텀 CSS 파일 생성

✅ **해야 할 것:**

1. 항상 `npx shadcn@latest add` 명령어로 컴포넌트 추가
2. Tailwind CSS 유틸리티 클래스 사용
3. TypeScript 타입 정의
4. 컴포넌트 재사용성 고려

## 참고 자료

- [shadcn/ui 공식 문서](https://ui.shadcn.com)
- [Tailwind CSS 문서](https://tailwindcss.com)
- [Lucide Icons](https://lucide.dev)

---

**이 규칙을 따라 일관성 있고 유지보수 가능한 코드를 작성하세요.**
