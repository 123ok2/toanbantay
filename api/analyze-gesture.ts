import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { imageBase64 } = req.body || {};
    if (!imageBase64) {
      return res.status(400).json({ error: "Thiếu dữ liệu hình ảnh (imageBase64)" });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        gestureName: "Chưa cấu hình API Key Gemini",
        emoji: "ℹ️",
        confidence: 0,
        explanation: "API Key Gemini chưa được cấu hình. Hệ thống vẫn đang sử dụng mô hình nhận diện trực tiếp MediaPipe trên thiết bị.",
        handDetected: false,
      });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const prompt = `Bạn là Chuyên gia Thông dịch & Giáo dục Ngôn ngữ Ký hiệu (Sign Language Expert) cho người khiếm thính / câm điếc.
Hãy phân tích hình ảnh cử chỉ bàn tay từ camera và xác định đây là chữ cái ngón tay (Finger-spelling) hay cử chỉ giao tiếp Ngôn ngữ ký hiệu nào (VSL / ASL).

Một số ký hiệu chính:
- 🤟 : "Tôi yêu bạn" (I Love You sign)
- ✋ : "Xin chào / Dừng lại / Số 5" (Hello / Open Palm)
- 👍 : "Tốt / Cảm ơn / Đồng ý" (Thumbs Up / Thank You)
- 👎 : "Chưa tốt / Không đồng ý" (Thumbs Down)
- ✌️ : "Chữ V / Số 2 / Hòa bình" (Letter V / Victory)
- 🤙 : "Chữ L" (Letter L) hoặc "Chữ Y" (Letter Y)
- ☝️ : "Chữ D / Số 1 / Chú ý" (Index Up)
- ✊ : "Chữ S / Chữ A / Nắm tay" (Fist)
- 👌 : "Chữ O / OK / Hoàn hảo" (OK Sign)
- 🖐️ : "Chữ B / Chữ I" (Finger spelling)

Trả về định dạng JSON duy nhất như sau:
{
  "gestureName": "Tên chữ cái hoặc cụm từ Ngôn ngữ ký hiệu bằng tiếng Việt",
  "emoji": "Biểu tượng emoji tương ứng",
  "confidence": 90,
  "explanation": "Giải thích chi tiết vị trí ngón tay, ý nghĩa và bối cảnh sử dụng khi giao tiếp với người khiếm thính (2-3 câu ngắn gọn, dễ hiểu)",
  "handDetected": true
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: cleanBase64,
              },
            },
            { text: prompt },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const resultText = response.text || "{}";
    const jsonMatch = resultText.match(/\{[\s\S]*\}/);
    const parsedData = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    return res.json(parsedData);
  } catch (error: any) {
    console.error("Vercel Analyze Gesture error:", error);
    return res.status(500).json({ error: "Không thể phân tích cử chỉ qua Gemini", details: error.message });
  }
}
