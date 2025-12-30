# Gemini AI Messenger (Chat_Jp)

Google Gemini 3 Flash API를 활용한 실시간 AI 채팅 애플리케이션입니다.

## 🚀 주요 기능
- **실시간 스트리밍 응답**: Gemini API를 사용하여 답변을 실시간으로 출력합니다.
- **채팅 히스토리**: 로컬 스토리지를 활용해 이전 대화 내역을 저장합니다.
- **반응형 디자인**: Tailwind CSS를 사용해 모바일과 데스크톱 모두 최적화된 UI를 제공합니다.
- **다크 모드**: 사용자 선호에 맞는 테마 선택이 가능합니다.

## 📦 배포 방법 (Vercel)

1. 이 레포지토리를 GitHub에 푸시합니다.
2. [Vercel](https://vercel.com)에 로그인하고 **New Project**를 클릭합니다.
3. 레포지토리를 연결합니다.
4. **Environment Variables** 설정 섹션에서 다음을 추가합니다 (중요!):
   - **Key**: `API_KEY`
   - **Value**: `여러분의_GEMINI_API_KEY`
5. **Deploy** 버튼을 누르면 끝!

## 🛠 기술 스택
- React 19
- Google GenAI SDK (Gemini API)
- Tailwind CSS (CDN)
- Vite (Bundler)

---
Developed by jpjp92