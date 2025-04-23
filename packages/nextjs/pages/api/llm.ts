// File: packages/nextjs/pages/api/llm.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt, model, ossUrl } = req.body;

  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Missing or invalid prompt." });
  }

  try {
    let output = "";

    if (model === "openai") {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0,
      });

      output = completion.choices[0]?.message?.content || "(no response)";
    } else if (model === "oss" && ossUrl) {
      const ossRes = await fetch(ossUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "mistral", // default model for OSS
          prompt,
        }),
      });

      const reader = ossRes.body?.getReader();
      const decoder = new TextDecoder();
      let rawOutput = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          rawOutput += decoder.decode(value, { stream: true });
        }
      }

      const lines = rawOutput.trim().split("\n");
      const merged = lines
        .map(line => {
          try {
            const parsed = JSON.parse(line);
            return parsed.response || "";
          } catch {
            return "";
          }
        })
        .join("");

      output = merged || "(no output from OSS model)";
    } else {
      return res.status(400).json({ error: "Invalid OSS model setup." });
    }

    res.status(200).json({ output });
  } catch (err) {
    console.error("LLM handler error:", err);
    res.status(500).json({ error: "Failed to process prompt." });
  }
}
