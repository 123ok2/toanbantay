import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Server-side Gemini AI Client
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

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", geminiAvailable: !!getGeminiClient() });
});

// Natural Vietnamese Text-To-Speech (TTS) Proxy Endpoint
app.get("/api/tts", async (req, res) => {
  try {
    const rawText = (req.query.text as string) || "Chính xác";
    // Clean text: remove emojis, special symbols, and math brackets for natural Vietnamese speech
    const cleanText = rawText
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
      .replace(/[➕➖✖️➗📐⚖️🧩💎⚡🎯🚤🤝🌿🌟💯🛑🧮💡🎉🍬🍪🚀🍊🍎⭐🎈]/g, "")
      .replace(/[\n\r\t]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 200);

    if (!cleanText) {
      return res.status(400).json({ error: "Empty text for TTS" });
    }

    const encoded = encodeURIComponent(cleanText);
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=vi&client=tw-ob`;

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: "TTS service unavailable" });
    }

    const arrayBuffer = await response.arrayBuffer();
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    console.error("TTS proxy error:", err);
    res.status(500).json({ error: "Failed to synthesize speech" });
  }
});

// Gemini AI Math Tutor endpoint - CHỈ ĐƯA HƯỚNG DẪN & GỢI Ý TƯ DUY, KHÔNG ĐƯA THẲNG ĐÁP ÁN
app.post("/api/solve-math", async (req, res) => {
  try {
    const { problemText, gradeLevel } = req.body;
    if (!problemText) {
      return res.status(400).json({ error: "Thiếu đề bài toán (problemText)" });
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Intelligent offline guidance template (pedagogical guidance without giving direct answer)
      let guidingSteps: string[] = [];
      let thinkingPrompt = "Theo em, sau khi thực hiện các bước hướng dẫn trên, kết quả cuối cùng là bao nhiêu?";
      let visualAnalogy = "📐 Áp dụng quy tắc biến đổi và gợi ý phương pháp giải";
      let explanation = `Để giải bài toán "${problemText}", em hãy thực hiện theo các bước hướng dẫn dưới đây để tự tìm ra kết quả chính xác nhé!`;
      let hiddenAnswer = "Xem gợi ý kết quả sau khi tự làm";
      let encouragement = "Em hãy tự tin tính nháp từng bước theo hướng dẫn nhé! Tư duy độc lập là chìa khóa học giỏi Toán! 🌟";

      const lower = problemText.toLowerCase();

      if (lower.includes("3x - 15 = 45")) {
        guidingSteps = [
          "Bước 1 (Xác định dạng toán): Đây là bài toán tìm x trong phương trình bậc nhất một ẩn.",
          "Bước 2 (Quy tắc chuyển vế): Chuyển số hạng tự do (-15) từ vế trái sang vế phải và đổi dấu thành (+15). Khi đó vế phải sẽ thành: 45 + 15.",
          "Bước 3 (Rút gọn): Tính tổng 45 + 15 để tìm giá trị của 3x.",
          "Bước 4 (Tìm x): Lấy kết quả vừa tìm được chia cho hệ số 3 để ra giá trị của x.",
        ];
        thinkingPrompt = "Em hãy tính: 45 + 15 bằng bao nhiêu, rồi lấy số đó chia cho 3 để tìm x nhé!";
        visualAnalogy = "⚖️ Gợi ý: 3x - 15 = 45 ➡️ 3x = 45 + 15 ➡️ x = (Tổng vừa tính) : 3";
        hiddenAnswer = "x = 20";
        explanation = "Hướng dẫn: Áp dụng quy tắc chuyển vế đổi dấu: khi chuyển một số hạng từ vế này sang vế kia của đẳng thức, ta phải đổi dấu của số hạng đó. Sau đó chia cả 2 vế cho 3.";
      } else if (lower.includes("ucln") || lower.includes("ước chung") || lower.includes("bcnn")) {
        guidingSteps = [
          "Bước 1 (Phân tích thừa số nguyên tố): Phân tích 24 và 36 ra tích các thừa số nguyên tố: 24 = 2³ . 3 và 36 = 2² . 3².",
          "Bước 2 (Tìm ƯCLN): Chọn ra các thừa số nguyên tố chung với số mũ nhỏ nhất, rồi lập tích của chúng.",
          "Bước 3 (Tìm BCNN): Chọn ra các thừa số nguyên tố chung và riêng với số mũ lớn nhất, rồi lập tích của chúng.",
        ];
        thinkingPrompt = "Em hãy nhân tích: (2² x 3) để tìm ƯCLN và nhân tích (2³ x 3²) để tìm BCNN nhé!";
        visualAnalogy = "🧩 24 = 2³ . 3 | 36 = 2² . 3² ➡️ ƯCLN: mũ nhỏ nhất | BCNN: mũ lớn nhất";
        hiddenAnswer = "ƯCLN(24, 36) = 12; BCNN(24, 36) = 72";
        explanation = "Quy tắc tìm ƯCLN: Lấy các thừa số chung với số mũ nhỏ nhất. Quy tắc tìm BCNN: Lấy các thừa số chung và riêng với số mũ lớn nhất.";
      } else if (lower.includes("pythagoras") || lower.includes("cạnh huyền") || lower.includes("ab = 6")) {
        guidingSteps = [
          "Bước 1 (Định lý Pythagoras): Trong tam giác vuông ABC tại A, bình phương cạnh huyền bằng tổng bình phương hai cạnh góc vuông: BC² = AB² + AC².",
          "Bước 2 (Thay số): Tính AB² = 6² = 36 và AC² = 8² = 64.",
          "Bước 3 (Tính tổng): Cộng hai giá trị: BC² = 36 + 64.",
          "Bước 4 (Tìm cạnh huyền): Lấy căn bậc hai của tổng vừa tính để ra độ dài cạnh BC.",
        ];
        thinkingPrompt = "Em hãy cộng 36 + 64 = ?, sau đó tính căn bậc hai của số đó để tìm độ dài BC nhé!";
        visualAnalogy = "📐 BC² = 6² + 8² = 36 + 64 ➡️ BC = √(tổng)";
        hiddenAnswer = "BC = 10 cm";
        explanation = "Định lý Pythagoras phát biểu: Trong tam giác vuông, bình phương cạnh huyền bằng tổng bình phương hai cạnh góc vuông.";
      } else if (lower.includes("hệ phương trình") || (lower.includes("2x + y = 7") && lower.includes("x - y = 2"))) {
        guidingSteps = [
          "Bước 1 (Nhận xét hệ số): Ta thấy biến y ở hai phương trình có hệ số đối nhau (+1 và -1).",
          "Bước 2 (Cộng đại số): Cộng từng vế của hai phương trình để khử biến y: (2x + x) + (y - y) = 7 + 2.",
          "Bước 3 (Tìm x): Giải phương trình thu được: 3x = 9 để tìm x.",
          "Bước 4 (Tìm y): Thay giá trị x vừa tìm được vào phương trình x - y = 2 để tìm y.",
        ];
        thinkingPrompt = "Từ 3x = 9, em tính ra x bằng bao nhiêu? Sau đó thay vào x - y = 2 để tìm y nhé!";
        visualAnalogy = "🤝 (2x + y) + (x - y) = 7 + 2 ➡️ 3x = 9 ➡️ Tìm x rồi thế vào tìm y";
        hiddenAnswer = "x = 3; y = 1 (Nghiệm (3; 1))";
        explanation = "Phương pháp cộng đại số: Khi các hệ số của cùng một biến đối nhau, ta cộng từng vế của hai phương trình để triệt tiêu biến đó.";
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
  "thinkingPrompt": "Câu hỏi gợi mở ngắn gọn để học sinh tự hoàn thành phép tính cuối cùng (Ví dụ: 'Em hãy tính xem 45 + 15 bằng bao nhiêu rồi chia cho 3 nhé!')",
  "visualAnalogy": "Minh họa sơ đồ/emoji ngắn gọn định hướng phương pháp (Ví dụ: 🍎 + 🍎🍎 = ? hoặc 3x = 45 + 15 ➡️ x = ?)",
  "explanation": "Lời giải thích phương pháp sư phạm, cách tư duy mạch lạc dễ hiểu (khoảng 2 đoạn ngắn bằng tiếng Việt chuẩn)",
  "encouragement": "Lời động viên khích lệ học sinh tự tin tư duy và rèn luyện tính toán độc lập",
  "hiddenAnswer": "Đáp số ngắn gọn (chỉ dùng để đối chiếu khi học sinh chủ động mở khóa kiểm tra, ví dụ: 'x = 20' hoặc '15 chiếc')"
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
    console.error("Lỗi khi hướng dẫn giải toán qua Gemini:", error);
    return res.status(500).json({
      error: "Không thể nhận hướng dẫn giải toán qua AI",
      details: error.message,
    });
  }
});

// Gemini Vision analysis endpoint for Sign Language & Gesture Interpretation
app.post("/api/analyze-gesture", async (req, res) => {
  try {
    const { imageBase64 } = req.body;
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

    // Remove data:image/jpeg;base64, prefix if present
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
    console.error("Lỗi khi phân tích cử chỉ với Gemini:", error);
    return res.status(500).json({
      error: "Không thể phân tích cử chỉ qua Gemini",
      details: error.message,
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
