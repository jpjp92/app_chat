
# 🚀 Chat_Jp - Next-Gen Gemini AI Messenger

**Chat_Jp**는 Google의 최신 **Gemini 3 Flash Preview** 엔진을 탑재하여, 텍스트를 넘어 문서(PDF), 이미지, 웹 콘텐츠까지 완벽하게 이해하고 대화하는 지능형 메신저입니다.

---

## ✨ 주요 기능 (Key Features)

### 📄 지능형 문서 및 이미지 분석 (Multi-modal)
- **PDF 딥러닝 분석**: 최대 10MB의 PDF 파일을 업로드하여 요약, 특정 내용 추출, 복잡한 표 해석이 가능합니다.
- **이미지 시각 지능**: 사진을 업로드하면 상황을 설명하거나 이미지 내 텍스트를 인식합니다.

### 🌐 실시간 웹 및 유튜브 요약
- **URL 컨텍스트 분석**: 웹사이트 주소나 유튜브 링크를 붙여넣으면 **Jina AI Reader**를 통해 핵심 내용을 즉시 파싱하고 요약해 드립니다.

### 🎙️ 직관적인 음성 인터페이스 (STT/TTS)
- **말하는 대로 입력 (STT)**: 마이크 아이콘을 눌러 자연스럽게 말하면 텍스트로 변환됩니다. (연속 인식 모드 지원)
- **목소리로 듣기 (TTS)**: Gemini의 고품질 음성 합성 기능을 통해 AI의 답변을 목소리로 직접 들을 수 있습니다.

### 🎨 프리미엄 사용자 경험 (UX/UI)
- **지능형 다크모드**: 눈이 편안한 디자인과 매끄러운 다크/라이트 모드 전환.
- **다국어 지원**: 한국어, 영어, 스페인어, 프랑스어 등 4개 국어 완벽 대응.
- **스토리지 최적화**: 대용량 파일 데이터는 브라우저 용량 제한을 초과하지 않도록 스마트하게 관리되어 앱이 멈추지 않습니다.

---

## 🛠️ 배포 및 설정 가이드 (Deployment)

이 프로젝트는 **Vercel** 환경에 최적화되어 있습니다.

### 1. API 키 발급
- [Google AI Studio](https://aistudio.google.com/app/apikey)에서 무료 또는 유료 API 키를 발급받으세요.

### 2. Vercel 환경 변수 설정 (필수)
배포 시 프로젝트 설정의 **Environment Variables**에 다음을 추가해야 합니다.
- **Key**: `API_KEY`
- **Value**: `여러분의_제미나이_API_키`

### 3. 보안 환경 주의사항
- **마이크 권한**: 브라우저 보안 정책상 음성 인식 기능은 반드시 **HTTPS** 환경에서만 작동합니다. 로컬 테스트 시 작동하지 않는다면 Vercel 배포 후 확인하세요.

---

## 🏗️ 기술 스택 (Tech Stack)

- **Frontend**: React 19 (Latest), Tailwind CSS, TypeScript
- **AI Model**: 
  - `gemini-3-flash-preview` (대화 및 분석)
  - `gemini-2.5-flash-preview-tts` (음성 합성)
- **Build Tool**: Vite
- **Integrations**: Jina AI (Web Reading), Font Awesome 6

---

## 💡 개발자 팁
- **PDF 분석이 안 되나요?**: 파일이 너무 크거나 암호가 걸려 있는지 확인해 보세요. (권장: 10MB 이하)
- **음성 인식이 멈추나요?**: HTTPS 주소로 접속했는지, 브라우저에서 마이크 권한을 허용했는지 확인하세요.

---
Developed with ❤️ by **jpjp92**  
Powered by **Google Gemini Intelligence**
