
# 🚀 Chat_Jp - Next-Gen Gemini Messenger

**Chat_Jp**는 Google의 최신 **Gemini 3 Flash Preview** 모델을 탑재한 고성능 인공지능 채팅 애플리케이션입니다.

## 🚀 Vercel 배포 시 주의사항 (필독)

이 앱은 음성 인식(STT)과 고성능 API 통신을 사용하므로, 배포 시 다음 설정을 반드시 확인해야 합니다.

### 1. API_KEY 설정 (필수)
- [Google AI Studio](https://aistudio.google.com/app/apikey)에서 발급받은 키를 Vercel 프로젝트 설정의 **Environment Variables**에 등록하세요.
- **Key**: `API_KEY`
- **Value**: 발급받은 키값

### 2. HTTPS 환경
- Vercel에 배포하면 자동으로 `https://` 주소가 부여됩니다.
- **마이크 권한 및 음성 인식**은 보안 정책상 반드시 HTTPS 환경에서만 정상 작동합니다. 로컬 테스트 중 에러가 발생한다면 배포 후 테스트해 보세요.

### 3. 음성 인식(STT) 관련
- `no-speech` 에러가 발생한다면 마이크 권한이 허용되었는지, 혹은 주변이 너무 조용한지 확인해 보세요.
- 이번 업데이트로 **연속 인식 모드**가 적용되어 훨씬 안정적으로 대화가 가능합니다.

## ✨ 주요 기능
- **⚡ Gemini 3 Flash Engine**: 지연 시간을 최소화한 초고속 응답.
- **🎥 유튜브/웹 요약**: URL만 넣으면 AI가 내용을 즉시 분석.
- **🎙️ 음성 채팅 (STT/TTS)**: 말로 질문하고 목소리로 답변을 듣는 기능.
- **📸 이미지 분석**: 사진 속 정보를 분석하는 멀티모달 기능.

---
Developed with ❤️ by **jpjp92**
Powered by **Gemini Intelligence**
