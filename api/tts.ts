import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const rawText = (req.query.text as string) || "Chính xác";
    const cleanText = rawText
      .replace(
        /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,
        ""
      )
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
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
    return res.status(200).send(buffer);
  } catch (error: any) {
    console.error("Vercel TTS error:", error);
    return res.status(500).json({ error: "Failed to generate speech", details: error.message });
  }
}
