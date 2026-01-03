import { GoogleGenerativeAI } from "@google/generative-ai";

// Gemini API 키 (환경 변수 사용 권장)
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "YOUR_API_KEY_HERE";

// Gemini AI 초기화
const genAI = new GoogleGenerativeAI(API_KEY);

// 텍스트 생성 함수
export async function generateText(prompt: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("텍스트 생성에 실패했습니다.");
  }
}

// 영어 문장 교정 함수
export async function correctEnglish(text: string): Promise<string> {
  const prompt = `Please correct the following English text and explain any mistakes:

"${text}"

Provide:
1. Corrected version
2. Brief explanation of errors`;

  return await generateText(prompt);
}

// 영어 번역 함수
export async function translateToEnglish(koreanText: string): Promise<string> {
  const prompt = `Translate the following Korean text to natural English:

"${koreanText}"`;

  return await generateText(prompt);
}

// 영어 학습 도움 함수
export async function explainGrammar(sentence: string): Promise<string> {
  const prompt = `Explain the grammar and structure of this English sentence in Korean:

"${sentence}"

Please provide:
1. Grammar breakdown
2. Key vocabulary
3. Usage tips`;

  return await generateText(prompt);
}
