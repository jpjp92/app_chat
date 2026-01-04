
import { GoogleGenAI, GenerateContentResponse, Part, Modality, Type } from "@google/genai";
import { Role, Message, MessageAttachment, Language, GroundingSource } from "../types";

let currentAudioSource: AudioBufferSourceNode | null = null;
let sharedAudioContext: AudioContext | null = null;

/**
 * 활성 가능한 API 키 목록 가져오기
 */
const getApiKeys = () => {
  const keys = [process.env.API_KEY, process.env.API_KEY2].filter(k => k && k !== "undefined" && k.trim() !== "");
  return keys;
};

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

/**
 * 페일오버를 지원하는 Gemini 실행 유틸리티
 */
async function runWithFailover<T>(operation: (ai: GoogleGenAI) => Promise<T>): Promise<T> {
  const keys = getApiKeys();
  if (keys.length === 0) throw new Error("No valid API keys found.");

  let lastError: any = null;
  for (let i = 0; i < keys.length; i++) {
    try {
      const ai = new GoogleGenAI({ apiKey: keys[i]! });
      return await operation(ai);
    } catch (error: any) {
      console.warn(`API Key ${i + 1} failed, trying next if available...`, error);
      lastError = error;
      continue;
    }
  }
  throw lastError;
}

/**
 * Gemini 채팅 스트리밍 응답
 */
export const streamChatResponse = async (
  prompt: string, 
  history: Message[], 
  onChunk: (chunk: string) => void,
  language: Language = 'ko',
  attachment?: MessageAttachment,
  webContent?: string,
  contentType: 'text' | 'web' | 'video' = 'text',
  onMetadata?: (sources: GroundingSource[]) => void
) => {
  const langNames = { ko: 'Korean', en: 'English', es: 'Spanish', fr: 'French' };
  
  // 날씨 및 지역 정보 검색 최적화 인스트럭션
  let systemInstruction = `You are a professional AI assistant. Respond in ${langNames[language]}. 
  Use Markdown for beautiful formatting.
  
  [GROUNDING INSTRUCTION]
  - Use Google Search for: weather, news, current time, stock prices, and factual verification.
  - For weather queries: Always provide the current temperature, precipitation, and a brief recommendation (e.g., "Take an umbrella").
  - If a specific location isn't mentioned for weather, assume the user's current context is South Korea unless specified otherwise.
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

  await runWithFailover(async (ai) => {
    const result = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
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
        onChunk(chunk.text);
      }
    }
  });
};

/**
 * Gemini TTS 생성
 */
export const generateSpeech = async (text: string): Promise<Uint8Array> => {
  return await runWithFailover(async (ai) => {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
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
