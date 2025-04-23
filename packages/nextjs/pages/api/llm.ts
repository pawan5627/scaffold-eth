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
    const systemPrompt = `You are a smart contract assistant for a Uniswap interface. Convert user input into structured JSON.
Return ONLY a valid JSON object.

Example input: swap 10 USDC for ETH
Example output:
{
  "action": "swap",
  "tokenIn": "USDC",
  "tokenOut": "ETH",
  "amount": 10
}`;

    if (model === "openai") {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
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
          model: "mistral",
          prompt: `${systemPrompt}\nUser input: ${prompt}`,
        }),
      });

      const reader = ossRes.body?.getReader();
      const decoder = new TextDecoder();
      let rawOutput = "";

      if (reader) {
        let done = false;
        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          if (value) {
            rawOutput += decoder.decode(value, { stream: true });
          }
        }
      }

      const lines = rawOutput
        .split("\n")
        .map(line => line.trim())
        .filter(line => line.length > 0);

      const merged = lines
        .map(line => {
          try {
            const parsed = JSON.parse(line);
            return parsed.response || "";
          } catch (err) {
            console.warn("Failed to parse OSS response line:", err);
            return "";
          }
        })
        .join("");

      output = merged || "(no output from OSS model)";
    } else {
      return res.status(400).json({ error: "Invalid OSS model setup." });
    }

    // Attempt to parse structured output
    let structured: any = null;
    try {
      structured = JSON.parse(output);
    } catch (err) {
      console.warn("LLM returned invalid JSON:", err);
    }

    res.status(200).json({ output, structured });
  } catch (err) {
    console.error("LLM handler error:", err);
    res.status(500).json({ error: "Failed to process prompt." });
  }
}
