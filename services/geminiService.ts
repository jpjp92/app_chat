
import { GoogleGenAI, GenerateContentResponse, Part, Modality } from "@google/genai";
import { Role, Message, MessageImage, Language } from "../types";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

let currentAudioSource: AudioBufferSourceNode | null = null;
let sharedAudioContext: AudioContext | null = null;

// 가이드라인에 따른 표준 베이스64 디코더
function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// 가이드라인에 따른 표준 오디오 데이터 디코더
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  // PCM 16-bit raw data를 Float32Array로 변환 (엔디언 및 정렬 고려)
  const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
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

export const streamChatResponse = async (
  prompt: string, 
  history: Message[], 
  onChunk: (chunk: string) => void,
  language: Language = 'ko',
  attachedImage?: MessageImage,
  webContent?: string,
  contentType: 'text' | 'web' | 'video' = 'text'
) => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY is missing");

  const ai = new GoogleGenAI({ apiKey });
  const formattedHistory = history.map(msg => ({
    role: msg.role === Role.USER ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));

  const langNames = { ko: 'Korean', en: 'English', es: 'Spanish', fr: 'French' };
  let systemInstruction = `You are a helpful AI assistant. Respond in ${langNames[language]}. Use markdown.`;
  
  if (webContent) {
    systemInstruction += `\n\n[CONTEXT]\n${webContent}`;
  }

  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    history: formattedHistory,
    config: { systemInstruction },
  });

  const result = await chat.sendMessageStream({ 
    message: attachedImage ? [{ text: prompt }, { inlineData: { data: attachedImage.data.split(',')[1], mimeType: attachedImage.mimeType } }] : prompt 
  });
  
  let fullText = "";
  for await (const chunk of result) {
    const text = (chunk as GenerateContentResponse).text;
    if (text) {
      fullText += text;
      onChunk(text);
    }
  }
  return fullText;
};

export const generateSpeech = async (text: string): Promise<Uint8Array> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key is missing");

  const ai = new GoogleGenAI({ apiKey });
  // 너무 긴 텍스트는 TTS 엔진 성능을 위해 앞부분 500자 정도로 제한하여 요청
  const truncatedText = text.length > 500 ? text.substring(0, 500) + "..." : text;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: truncatedText }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' }, 
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio data returned");

  return decodeBase64(base64Audio);
};

export const stopAudio = () => {
  if (currentAudioSource) {
    try {
      currentAudioSource.stop();
    } catch (e) {}
    currentAudioSource = null;
  }
};

export const playRawAudio = async (data: Uint8Array) => {
  stopAudio();

  if (!sharedAudioContext) {
    sharedAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }
  
  if (sharedAudioContext.state === 'suspended') {
    await sharedAudioContext.resume();
  }

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
