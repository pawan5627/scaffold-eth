"use client";

import { useState } from "react";

interface TestCase {
  prompt: string;
  expected: string;
}

export default function TaskEvaluationPage() {
  const [testCases, setTestCases] = useState<TestCase[]>([
    { prompt: "swap 10 BTC for ETH", expected: "swap 10 BTC → ETH" },
    { prompt: "deposit 5 USDT and 5 XRP", expected: "add 5 USDT + 5 XRP to liquidity pool" },
    { prompt: "redeem liquidity from BNB/SOL", expected: "remove liquidity from BNB/SOL pair" },
    { prompt: "what are the reserves of USDC/DOGE", expected: "return reserve0 and reserve1" },
    { prompt: "swap 10 BTC for ETH", expected: "❌ unsupported token" },
    { prompt: "add liquidity using 20 BNB and 20 SOL", expected: "approve & mint BNB/SOL pair" },
    { prompt: "remove all liquidity from USDC/DOGE", expected: "burn LP tokens from USDC/DOGE" },
    { prompt: "what's the volume of ADA/TRX", expected: "query volume for ADA/TRX" },
    { prompt: "how many swaps happened in BTC/ETH", expected: "query swap count" },
    { prompt: "get price for 1 LINK in SUI", expected: "estimate output of swap" },
    { prompt: "swap 1000 ETH for BTC and USDT", expected: "❌ invalid multi-token swap" },
    { prompt: "simulate price impact for 100 USDT to XRP", expected: "❌ unsupported analysis" },
    { prompt: "redeem liquidity for non-existent pair", expected: "❌ no pair found" },
    { prompt: "find best pool to swap BTC", expected: "❌ requires external data" },
    { prompt: "add tokens BTC USDT C into pool", expected: "❌ only 2-token pools supported" },
    { prompt: "deposit invalidtoken and BTC", expected: "❌ unknown token" },
    { prompt: "swap from nothing to something", expected: "❌ malformed prompt" },
    { prompt: "get reserves for all pools", expected: "❌ batch query not implemented" },
    { prompt: "mint tokens to my wallet", expected: "❌ unauthorized operation" },
    { prompt: "graph prices of USDT/XRP", expected: "display historical swaps for USDT/XRP" },
  ]);

  const [results, setResults] = useState<Record<number, { openai: string; oss: string }>>({});
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);
  const [newPrompt, setNewPrompt] = useState("");
  const [newExpected, setNewExpected] = useState("");
  const [ossUrl, setOssUrl] = useState("");

  async function runTest(index: number, prompt: string, model: "openai" | "oss") {
    setLoadingIndex(index);
    try {
      // Assuming '/api/llm' endpoint exists and handles 'openai' and 'oss' models
      const res = await fetch("/api/llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          model,
          ossUrl, // 🔥 send it here
        }),
      });
      const data = await res.json();
      setResults(prev => ({
        ...prev,
        [index]: {
          ...prev[index],
          [model]: data.output || "(no output)", // Adjust based on actual API response structure
        },
      }));
    } catch (err) {
      console.error(`Error running test for ${model}:`, err); // Added console log
      setResults(prev => ({
        ...prev,
        [index]: {
          ...prev[index],
          [model]: "❌ error",
        },
      }));
    }
    setLoadingIndex(null);
  }

  function addTestCase() {
    if (newPrompt && newExpected) {
      setTestCases([...testCases, { prompt: newPrompt, expected: newExpected }]);
      setNewPrompt("");
      setNewExpected("");
    }
  }

  return (
    <div className="p-10">
      {" "}
      {/* Main padding like UniswapPage */}
      <h1 className="text-3xl font-bold mb-6">🧪 LLM Prompt Evaluation</h1> {/* Title styling */}
      {/* Add New Prompt Section - styled like UniswapPage sections */}
      <div className="p-4 border rounded mb-6 space-y-2">
        <h2 className="text-xl font-semibold mb-2">➕ Add New Prompt</h2>
        <div className="flex gap-2">
          <input
            className="border px-2 py-1 rounded w-1/2" // Input styling
            placeholder="New test prompt"
            value={newPrompt}
            onChange={e => setNewPrompt(e.target.value)}
          />
          <input
            className="border px-2 py-1 rounded w-1/2" // Input styling
            placeholder="Expected result"
            value={newExpected}
            onChange={e => setNewExpected(e.target.value)}
          />
          <button
            className="bg-green-600 text-white px-4 py-2 rounded" // Button styling
            onClick={addTestCase}
          >
            ➕ Add
          </button>
        </div>
        <div className="flex gap-2 items-center">
          <label className="w-32 font-medium">OSS Model URL:</label>
          <input
            className="border px-2 py-1 rounded w-full"
            placeholder="https://your-oss-model.com/api"
            value={ossUrl}
            onChange={e => setOssUrl(e.target.value)}
          />
        </div>
      </div>
      {/* Evaluation Results Table */}
      <div className="mt-6">
        {" "}
        {/* Adjusted margin top */}
        <table className="table-auto w-full border">
          {" "}
          {/* Basic table styling */}
          <thead>
            <tr className="bg-gray-900">
              {" "}
              {/* Header background */}
              <th className="border px-4 py-2 text-left">#</th> {/* Cell styling */}
              <th className="border px-4 py-2 text-left">Prompt</th>
              <th className="border px-4 py-2 text-left">Expected</th>
              <th className="border px-4 py-2 text-left">OpenAI Output</th>
              <th className="border px-4 py-2 text-left">OSS Output</th>
              <th className="border px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {testCases.map((tc, i) => (
              <tr key={i}>
                <td className="border px-4 py-2 align-top">{i + 1}</td>
                <td className="border px-4 py-2 align-top">{tc.prompt}</td>
                <td className="border px-4 py-2 align-top">{tc.expected}</td>
                <td className="border px-4 py-2 whitespace-pre-wrap text-sm align-top">
                  {/* Display loading indicator similar to how disabled state works */}
                  {loadingIndex === i && results[i]?.openai === undefined ? "Running..." : results[i]?.openai || "-"}
                </td>
                <td className="border px-4 py-2 whitespace-pre-wrap text-sm align-top">
                  {/* Display loading indicator */}
                  {loadingIndex === i && results[i]?.oss === undefined ? "Running..." : results[i]?.oss || "-"}
                </td>
                <td className="border px-4 py-2 align-top space-y-1">
                  <button
                    className="bg-blue-600 text-white px-2 py-1 rounded w-full disabled:opacity-50" // Action button styling
                    disabled={loadingIndex === i}
                    onClick={() => runTest(i, tc.prompt, "openai")}
                  >
                    {/* Indicate loading on button */}
                    {loadingIndex === i && results[i]?.openai === undefined ? "Testing..." : "Test OpenAI"}
                  </button>
                  <button
                    className="bg-purple-600 text-white px-2 py-1 rounded w-full disabled:opacity-50" // Action button styling
                    disabled={loadingIndex === i}
                    onClick={() => runTest(i, tc.prompt, "oss")}
                  >
                    {/* Indicate loading on button */}
                    {loadingIndex === i && results[i]?.oss === undefined ? "Testing..." : "Test OSS"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Footer */}
      <footer className="text-center text-sm text-gray-500 mt-16 pb-6">
        © {new Date().getFullYear()} Uniswap v2 UI Assignment — Prompt Evaluation
      </footer>
    </div>
  );
}
