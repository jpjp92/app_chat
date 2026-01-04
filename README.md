
# 🚀 Aura Gemini - Intelligent Real-time AI Messenger

**Aura Gemini**는 Google의 최신 **Gemini 3** 엔진과 **실시간 Google 검색(Grounding)** 기능을 결합한 차세대 지능형 챗봇입니다. 단순한 대화를 넘어 웹, 문서, 이미지, 그리고 실시간 세상의 정보를 가장 정확하게 전달합니다.

---

## ✨ 핵심 기능 (Key Features)

### 🔍 실시간 Google 검색 (Search Grounding)
- **최신 정보 반영**: 학습 컷오프 데이터에 의존하지 않고, 현재 시점의 뉴스, 주가, 날씨, 사건 등을 Google 검색을 통해 실시간으로 확인하고 답변합니다.
- **투명한 출처 공개**: 답변 하단에 AI가 참고한 실제 웹사이트의 제목과 링크(Favicon 포함)를 카드 형태로 제공하여 정보의 신뢰성을 높였습니다.

### 📄 지능형 멀티모달 분석 (Multi-modal)
- **PDF 딥러닝 분석**: 최대 10MB의 PDF 파일을 업로드하여 복잡한 리포트 요약, 특정 데이터 추출, 논리적 해석이 가능합니다.
- **시각 지능**: 이미지를 분석하여 상황을 설명하거나, 사진 속 텍스트를 인식하고 분석합니다.

### 🌐 웹 콘텐츠 및 유튜브 요약
- **URL 컨텍스트 분석**: 웹사이트 주소나 유튜브 링크를 붙여넣으면 핵심 내용을 즉시 파싱하고 분석합니다. (Jina AI Reader 통합)

### 🎙️ 직관적인 음성 인터페이스 (STT/TTS)
- **연속 음성 인식 (STT)**: 마이크 아이콘을 눌러 자연스럽게 말하면 실시간으로 텍스트로 변환되며, 2초간 침묵 시 자동 전송되는 스마트 기능을 지원합니다.
- **고품질 음성 출력 (TTS)**: Gemini의 고해상도 음성 합성 엔진을 통해 AI의 답변을 자연스러운 목소리로 들을 수 있습니다.

### 🎨 프리미엄 사용자 경험 (UX/UI)
- **모던 글래스모피즘**: 눈이 편안한 다크 모드와 세련된 투명도 효과가 적용된 디자인.
- **다국어 완벽 지원**: 한국어, 영어, 스페인어, 프랑스어 등 4개 국어 UI 제공.
- **반응형 레이아웃**: 데스크탑, 태블릿, 모바일 등 모든 기기에서 최적화된 화면을 제공합니다.

---

## 🛠️ 배포 및 설정 (Deployment)

이 프로젝트는 **Vercel** 환경에 최적화되어 있습니다.

### 1. API 키 준비
- [Google AI Studio](https://aistudio.google.com/app/apikey)에서 무료 또는 유료 API 키를 발급받으세요.

### 2. Vercel 환경 변수 설정
프로젝트 설정의 **Environment Variables** 섹션에 아래 변수를 추가하세요.
- **Key**: `API_KEY`
- **Value**: `여러분의_Gemini_API_Key`

### 3. 보안 정책 및 권한
- **HTTPS 필수**: 브라우저 보안 정책상 마이크를 통한 음성 인식(STT)은 반드시 **HTTPS** 환경에서만 작동합니다. 
- **파일 제한**: PDF(10MB 미만), 이미지(4MB 미만) 업로드를 권장합니다.

---

## 🏗️ 기술 스택 (Tech Stack)

- **Core**: React 19, TypeScript, Vite
- **AI Engine**: 
  - `gemini-3-flash-preview` (대화 및 실시간 검색)
  - `gemini-2.5-flash-preview-tts` (음성 합성)
- **Styling**: Tailwind CSS
- **Integrations**: 
  - Google Search Grounding (실시간 정보)
  - Jina AI Reader (웹 콘텐츠 파싱)
  - Font Awesome 6 (아이콘)

---

## 💡 개발자 참고 사항
- **검색 접지(Grounding)**: SDK 가이드라인에 따라 `googleSearch` 도구는 다른 커스텀 Function Calling과 혼용하지 않고 단독으로 작동하여 정확도를 높였습니다.
- **스토리지 관리**: 대화 기록 및 사용자 프로필은 `localStorage`에 안전하게 저장되며, 파일 데이터는 브라우저 용량 제한을 넘지 않도록 최적화되어 관리됩니다.

---
Developed with by **jpjp92**  
*Powered by Google Gemini Next-Gen Intelligence*
