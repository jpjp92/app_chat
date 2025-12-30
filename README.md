# 🚀 Chat_Jp - Next-Gen Gemini Messenger

**Chat_Jp**는 Google의 최신 **Gemini 3 Flash Preview** 모델을 탑재한 고성능 인공지능 채팅 애플리케이션입니다. 세련된 인터페이스와 강력한 멀티모달 기능을 통해 텍스트 대화는 물론 이미지 분석까지 완벽하게 지원합니다.

## ✨ 주요 기능

- **⚡ Gemini 3 Flash Engine**: 최신 모델을 사용하여 지연 시간을 최소화한 초고속 스트리밍 응답을 제공합니다.
- **📸 멀티모달 시각 분석**: 이미지를 업로드하여 AI와 함께 사진 속 정보를 분석하고 질문을 주고받을 수 있습니다.
- **💾 스마트 세션 관리**: 대화 히스토리가 브라우저 로컬 저장소에 자동으로 저장되어, 재방문 시에도 대화를 이어갈 수 있습니다.
- **🖼️ 커스텀 프로필**: 사용자 이름과 아바타를 자유롭게 변경할 수 있으며, 설정된 정보는 영구적으로 유지됩니다.
- **🌙 프리미엄 UI/UX**: 
  - Tailwind CSS 기반의 세련된 글래스모피즘(Glassmorphism) 디자인.
  - 다크 모드(Dark Mode) 및 라이트 모드 완벽 대응.
  - 모바일과 데스크톱 모두에 최적화된 반응형 레이아웃.

## 🛠 기술 스택

- **Frontend**: React 19 (Latest), TypeScript
- **Styling**: Tailwind CSS
- **AI Engine**: @google/genai (Gemini 3 Flash Preview)
- **Deployment**: Vercel (Optimized)
- **Build Tool**: Vite

## 🚀 Vercel 배포 방법

이 프로젝트는 Vercel 환경에 최적화되어 있어 클릭 몇 번으로 배포가 가능합니다.

1. **GitHub 연동**: 이 프로젝트를 본인의 GitHub 레포지토리에 푸시합니다.
2. **Vercel 프로젝트 생성**: [Vercel Dashboard](https://vercel.com/new)에서 해당 레포지토리를 선택합니다.
3. **환경 변수 설정 (필수)**: 
   - `Settings` > `Environment Variables` 섹션으로 이동합니다.
   - **Key**: `API_KEY`
   - **Value**: [Google AI Studio](https://aistudio.google.com/app/apikey)에서 발급받은 API Key를 입력합니다.
4. **완료**: `Deploy`를 클릭하면 즉시 나만의 AI 채팅 앱이 라이브됩니다.

## 📝 로컬 개발 가이드

```bash
# 의존성 패키지 설치
npm install

# 개발 서버 실행 (localhost:3000)
npm run dev

# 프로덕션 빌드
npm run build
```

> **주의**: 로컬 환경에서 실행할 경우, `vite.config.ts` 또는 시스템 환경 변수에 `API_KEY`가 설정되어 있어야 Gemini API와 정상적으로 통신할 수 있습니다.

---
Developed with ❤️ by **jpjp92**
Powered by **Gemini Intelligence**