import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = 'AIzaSyBplv-HrQskzYPVityQXHnH3nBIver-naw';

export async function generateSlogan(brandName: string): Promise<string> {
  try {
    if (!API_KEY) {
      console.warn('Gemini API key not found');
      return `${brandName}과 함께 성공을 향한 여정을 시작하세요`;
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `다음 교육 브랜드를 위한 감동적이고 고급스러운 한국어 슬로건을 하나만 생성해주세요. 슬로건만 답변하고 다른 설명은 하지 마세요.

브랜드명: ${brandName}

요구사항:
- 교육과 성공에 대한 비전을 담을 것
- 감성적이고 영감을 주는 문구
- 10-15 단어 이내
- 따옴표 없이 슬로건만 답변`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    return text.replace(/^["']|["']$/g, '');
  } catch (error) {
    console.error('Gemini API error:', error);
    return `${brandName}과 함께 성공을 향한 여정을 시작하세요`;
  }
}
