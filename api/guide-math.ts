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
    const { problemText, gradeLevel } = req.body || {};
    if (!problemText) {
      return res.status(400).json({ error: "Thiếu nội dung bài toán (problemText)" });
    }

    const ai = getGeminiClient();
    if (!ai) {
      const lower = problemText.toLowerCase();
      let guidingSteps: string[] = [];
      let thinkingPrompt = "";
      let visualAnalogy = "";
      let hiddenAnswer = "";
      let explanation = "";
      const encouragement = "Em hãy bình tĩnh đọc kỹ từng bước và tự tin tự tính toán nhé, em làm được mà!";

      if (lower.includes("3") && lower.includes("2") && (lower.includes("+") || lower.includes("cộng"))) {
        guidingSteps = [
          "Bước 1 (Xác định số ban đầu): Chúng ta có 3 ngón tay ban đầu.",
          "Bước 2 (Quan sát phép tính): Dấu cộng (+) nghĩa là chúng ta đếm thêm vào.",
          "Bước 3 (Thao tác Finger Math): Bung thêm 2 ngón tay nữa liên tiếp (bốn, năm).",
          "Bước 4 (Kết luận): Đếm tổng số ngón tay đang xòe ra trên bàn tay.",
        ];
        thinkingPrompt = "3 ngón bung thêm 2 ngón nữa thì trên bàn tay có tất cả bao nhiêu ngón đang xòe ra?";
        visualAnalogy = "🖐️ (3 ngón) ➕ ✌️ (2 ngón) ➡️ 🖐️ (Tổng số ngón)";
        hiddenAnswer = "5";
        explanation = "Phép cộng ngón tay Finger Math: Bắt đầu từ số lớn hơn (3), sau đó đếm tiến thêm 2 đơn vị (4, 5).";
      } else {
        guidingSteps = [
          "Bước 1: Đọc kỹ đề bài, xác định các dữ kiện đã cho và đại lượng cần tìm.",
          "Bước 2: Lựa chọn công thức hoặc phương pháp biến đổi toán học phù hợp.",
          "Bước 3: Lập sơ đồ / biểu thức toán học tương ứng và tính toán từng bước.",
          "Bước 4: Kiểm tra lại tính hợp lý của các bước và tự đưa ra kết luận.",
        ];
        thinkingPrompt = "Em hãy thử áp dụng các bước định hướng trên vào giấy nháp và tính ra kết quả nhé!";
        visualAnalogy = "🧮 Phân tích đề ➡️ Thiết lập công thức ➡️ Tính toán từng bước";
        hiddenAnswer = "Tự tính toán theo các bước hướng dẫn trên";
      }

      return res.json({
        guidingSteps,
        thinkingPrompt,
        visualAnalogy,
        explanation,
        encouragement,
        hiddenAnswer,
      });
    }

    const prompt = `Bạn là một Gia Sư Toán Học AI Sư Phạm dành cho học sinh Việt Nam.
NGUYÊN TẮC CỐT LÕI QUAN TRỌNG NHẤT:
- TUYỆT ĐỐI KHÔNG ĐƯỢC ĐƯA RA NGAY ĐÁP SỐ CUỐI CÙNG TRONG LỜI HƯỚNG DẪN.
- Mục tiêu là HƯỚNG DẪN PHƯƠNG PHÁP, ĐỊNH HƯỚNG TƯ DUY TỪNG BƯỚC để học sinh tự làm, tự tính toán ra kết quả.

Cấp độ học tập: "${gradeLevel || "Tiểu học / THCS"}"
Đề bài: "${problemText}"

Hãy trả về duy nhất định dạng JSON như sau:
{
  "guidingSteps": [
    "Bước 1 (Phân tích): ...",
    "Bước 2 (Công thức / Phương pháp): ...",
    "Bước 3 (Gợi ý tính toán): ...",
    "Bước 4 (Định hướng bước cuối): ..."
  ],
  "thinkingPrompt": "Câu hỏi gợi mở ngắn gọn để học sinh tự hoàn thành phép tính cuối cùng",
  "visualAnalogy": "Minh họa sơ đồ/emoji ngắn gọn định hướng phương pháp",
  "explanation": "Lời giải thích phương pháp sư phạm, cách tư duy mạch lạc dễ hiểu bằng tiếng Việt chuẩn",
  "encouragement": "Lời động viên khích lệ học sinh tự tin tư duy và rèn luyện tính toán độc lập",
  "hiddenAnswer": "Đáp số ngắn gọn"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ text: prompt }],
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
    console.error("Vercel AI Guide Math error:", error);
    return res.status(500).json({ error: "Không thể nhận hướng dẫn giải toán qua AI", details: error.message });
  }
}
