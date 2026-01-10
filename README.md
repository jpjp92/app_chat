
# 🚀 Aura Gemini - Intelligent Real-time AI Messenger

**Aura Gemini**는 Google의 최신 **Gemini 3** 엔진과 **실시간 Google 검색(Grounding)** 기능을 결합한 차세대 지능형 챗봇입니다. 사용자 경험(UX)을 극대화하기 위해 Gemini 공식 웹 스타일을 계승하고, 강력한 시각화 기능을 탑재했습니다.

---

## ✨ 핵심 기능 (Key Features)

### 🎨 프리미엄 UI/UX (Premium Design)
- **Gemini 공식 스타일 반영**: 배경색(#131314)부터 사용자 말풍선, AI 응답의 투명한 레이아웃까지 공식 웹 버전의 감성을 그대로 구현했습니다.
- **지능형 표(Table) 렌더링**: 데이터 비교 요청 시 깨지지 않는 깔끔한 그리드 스타일과 반응형 레이아웃을 제공합니다.
- **다크/라이트 모드 최적화**: 어떤 환경에서도 눈이 편안한 색상 대비를 유지합니다.
- **세련된 캡슐형 입력창**: 이미지 첨부, 음성 인식, 전송 버튼이 직관적으로 배치된 최신 캡슐 디자인을 적용했습니다.

### 🌐 글로벌 다국어 지원 (Multi-language)
- **4개국어 완벽 지원**: 한국어(KO), 영어(EN), 스페인어(ES), 프랑스어(FR)를 지원하며, 각 언어별 맞춤형 환영 메시지와 시스템 인스트럭션을 제공합니다.

### 🛡️ 무중단 서비스 아키텍처 (Uninterrupted Service)
- **멀티 API 키 로테이션**: `API_KEY`와 `API_KEY2`를 활용한 지능형 할당량 관리로 서비스 중단을 최소화합니다.
- **지능형 모델 폴백 (Model Fallback)**: `gemini-3-flash-preview`를 메인으로 사용하며, 필요시 하위 모델로 자동 전환하여 안정성을 보장합니다.

### 🔍 실시간 지식 엔진 (Search Grounding)
- **실시간 Google 검색**: 최신 뉴스, 날씨, 기술 트렌드를 AI가 실시간으로 검색하여 답변합니다.
- **출처 링크 카드**: 답변 하단에 참고한 실제 웹사이트의 파비콘과 제목, 링크를 투명하게 공개합니다.

### 🎙️ 멀티모달 인터페이스
- **음성 인식 및 합성 (STT/TTS)**: 고품질 음성 엔진을 통해 답변을 읽어주며, 자연스러운 음성 대화가 가능합니다.
- **시각 지능**: 업로드된 이미지를 분석하고 텍스트를 인식하여 복합적인 질문에 답변합니다.

---

## 🛠️ 배포 및 설정 (Deployment)

이 프로젝트는 **Vercel** 환경에 최적화되어 있습니다.

### 1. API 키 준비
- [Google AI Studio](https://aistudio.google.com/app/apikey)에서 API 키를 발급받으세요.

### 2. Vercel 환경 변수 설정
- **API_KEY**: 메인 Gemini API Key
- **API_KEY2**: 백업용 Gemini API Key (권장)

---

## 🏗️ 기술 스택 (Tech Stack)

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **AI Engine**: 
  - `gemini-3-flash-preview` (Core Chat)
  - `gemini-2.5-flash-preview-tts` (Speech)
  - `googleSearch` (Grounding Tool)
- **Markdown**: ReactMarkdown (Remark GFM)
- **Deployment**: Vercel

---
Developed with ❤️ by **jpjp92**  
*Powered by Google Gemini Next-Gen Intelligence*
