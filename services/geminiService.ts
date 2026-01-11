
import { GoogleGenAI, GenerateContentResponse, Part, Modality, Type } from "@google/genai";
import { Role, Message, MessageAttachment, Language, GroundingSource } from "../types";

let currentAudioSource: AudioBufferSourceNode | null = null;
let sharedAudioContext: AudioContext | null = null;

/**
 * 메인 채팅 모델
 */
const CHAT_MODELS = [
  'gemini-3-flash-preview',
  'gemini-flash-latest'
];

/**
 * 요약 전용 Gemma 3 모델 및 사용자 정의 프롬프트
 */
export const SUMMARY_MODEL = 'gemma-3-4b-it';
export const TITLE_PROMPT = "다음 대화 내용을 분석하여 10자 이내의 아주 간결하고 명확한 채팅 제목을 만들어주세요. 따옴표나 마침표 없이 제목 텍스트만 출력하세요.";

/**
 * Base64 디코딩 유틸리티
 */
function decodeBase64(base64: string): Uint8Array {
  try {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (e) {
    return new Uint8Array(0);
  }
}

/**
 * PCM 오디오 데이터 디코딩
 */
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer, data.byteOffset, Math.floor(data.byteLength / 2));
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const isQuotaError = (error: any): boolean => {
  const msg = (error.message || "").toLowerCase();
  return msg.includes("quota") || msg.includes("429") || msg.includes("resource_exhausted");
};

async function runWithFailover<T>(
  modelCandidates: string[],
  operation: (ai: GoogleGenAI, model: string, isRetry: boolean) => Promise<T>
): Promise<T> {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API 키가 설정되지 않았습니다.");

  let lastError: any = null;
  const ai = new GoogleGenAI({ apiKey });

  for (let m = 0; m < modelCandidates.length; m++) {
    const currentModel = modelCandidates[m];
    const isRetry = m > 0;

    try {
      return await operation(ai, currentModel, isRetry);
    } catch (error: any) {
      lastError = error;
      if (isQuotaError(error)) continue; 
      break; 
    }
  }

  let finalMessage = lastError?.message || JSON.stringify(lastError);
  try {
    const parsed = JSON.parse(finalMessage);
    finalMessage = parsed.error?.message || finalMessage;
  } catch (e) {}
  
  throw new Error(finalMessage);
}

/**
 * Gemma 3를 이용한 대화 제목 요약
 */
export const summarizeConversation = async (history: Message[], language: Language = 'ko'): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return "New Chat";

  try {
    const ai = new GoogleGenAI({ apiKey });
    // 최근 대화 위주로 요약 데이터 생성
    const chatHistoryText = history.slice(-6).map(m => `${m.role === Role.USER ? 'User' : 'Assistant'}: ${m.content}`).join("\n");
    
    const response = await ai.models.generateContent({
      model: SUMMARY_MODEL,
      contents: [{
        parts: [{
          text: `${TITLE_PROMPT}\n\n[대화 내용]\n${chatHistoryText}\n\n제목:`
        }]
      }],
      config: {
        temperature: 0.3,
        maxOutputTokens: 25
      }
    });

    return response.text?.trim() || "New Chat";
  } catch (error) {
    console.warn("[Gemma 3 Summary Failed, using Fallback]", error);
    try {
      // Gemma 3 실패 시 Flash 모델로 폴백하여 안정성 확보
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: `Summarize this chat into a 3-word title in ${language}: ${history[0].content}` }] }]
      });
      return response.text?.replace(/["']/g, "").trim() || "New Chat";
    } catch (e) {
      return history[0]?.content.slice(0, 15) + "..." || "New Chat";
    }
  }
};

/**
 * Gemini 채팅 스트리밍 응답
 */
export const streamChatResponse = async (
  prompt: string, 
  history: Message[], 
  onChunk: (chunk: string, isReset: boolean) => void,
  language: Language = 'ko',
  attachment?: MessageAttachment,
  webContent?: string,
  contentType: 'text' | 'web' | 'video' = 'text',
  onMetadata?: (sources: GroundingSource[]) => void
) => {
  const langNames = { ko: 'Korean', en: 'English', es: 'Spanish', fr: 'French' };
  
  let systemInstruction = `You are a professional AI assistant. Respond in ${langNames[language]}. 
  Use Markdown for beautiful formatting.
  
  [GROUNDING INSTRUCTION]
  - Use Google Search for: weather, news, current time, stock prices, and factual verification.
  - Always extract and display source links via groundingMetadata.`;
  
  if (webContent) {
    systemInstruction += `\n\n[CONTENT TO ANALYZE]\n${webContent}`;
  }

  const contents: any[] = history
    .filter(msg => msg.content && msg.content.trim() !== "" && msg.role !== Role.SYSTEM)
    .slice(-10)
    .map(msg => ({
      role: msg.role === Role.USER ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

  let userParts: Part[] = [{ text: prompt }];
  if (attachment && attachment.data && attachment.data.trim() !== "") {
    const base64Data = attachment.data.includes(',') 
      ? attachment.data.split(',')[1] 
      : attachment.data;
    if (base64Data) {
      userParts.push({ inlineData: { data: base64Data, mimeType: attachment.mimeType } });
    }
  }
  contents.push({ role: 'user', parts: userParts });

  const modelConfig = { 
    systemInstruction,
    tools: [{ googleSearch: {} }] 
  };

  await runWithFailover(CHAT_MODELS, async (ai, model, isRetry) => {
    if (isRetry) {
      onChunk("", true);
    }

    const result = await ai.models.generateContentStream({
      model: model,
      contents,
      config: modelConfig,
    });
    
    for await (const chunk of result) {
      if (chunk.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        const chunks = chunk.candidates[0].groundingMetadata.groundingChunks;
        const sources: GroundingSource[] = chunks
          .filter(c => c.web)
          .map(c => ({
            title: c.web?.title || 'Untitled Source',
            uri: c.web?.uri || ''
          }))
          .filter(s => s.uri !== '');
        
        if (sources.length > 0 && onMetadata) {
          onMetadata(sources);
        }
      }

      if (chunk.text) {
        onChunk(chunk.text, false);
      }
    }
  });
};

/**
 * Gemini TTS 생성
 */
export const generateSpeech = async (text: string): Promise<Uint8Array> => {
  const ttsModels = ["gemini-2.5-flash-preview-tts", "gemini-flash-lite-latest"];
  
  return await runWithFailover(ttsModels, async (ai, model) => {
    const response = await ai.models.generateContent({
      model: model,
      contents: [{ parts: [{ text: text.slice(0, 2000) }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data");
    return decodeBase64(base64Audio);
  });
};

export const stopAudio = () => {
  if (currentAudioSource) {
    try { currentAudioSource.stop(); } catch (e) {}
    currentAudioSource = null;
  }
};

export const playRawAudio = async (data: Uint8Array) => {
  if (data.length === 0) return;
  stopAudio();
  if (!sharedAudioContext) {
    sharedAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }
  if (sharedAudioContext.state === 'suspended') await sharedAudioContext.resume();
  const audioBuffer = await decodeAudioData(data, sharedAudioContext, 24000, 1);
  const source = sharedAudioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(sharedAudioContext.destination);
  currentAudioSource = source;
  source.start();
  return new Promise<void>((resolve) => {
    source.onended = () => {
      if (currentAudioSource === source) currentAudioSource = null;
      resolve();
    };
  });
};
