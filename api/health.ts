import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const apiKey = process.env.GEMINI_API_KEY;
  const geminiAvailable = !!apiKey && apiKey !== "MY_GEMINI_API_KEY";
  return res.status(200).json({ status: "ok", geminiAvailable });
}
