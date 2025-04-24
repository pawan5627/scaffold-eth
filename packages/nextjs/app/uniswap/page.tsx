"use client";

import { useEffect, useState } from "react";
import ERC20ABI from "../../lib/abi/ERC20.json";
import UniswapV2FactoryABI from "../../lib/abi/UniswapV2Factory.json";
import UniswapV2PairABI from "../../lib/abi/UniswapV2Pair.json";
import { ethers } from "ethers";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type StructuredCommand =
  | {
      action: "swap";
      tokenIn: string;
      tokenOut: string;
      amount: number;
    }
  | {
      action: "deposit";
      amounts: { token: string; amount: number }[];
    }
  | {
      action: "redeem";
      pool: string[];
    }
  | {
      action: "query";
      type: "reserves" | "swaps" | "volume";
      pool: string[];
    };

const FACTORY_ADDRESS = "0x55cb3b67D9E65F0Cf4eABCAC84564a1bE6E3b06A";
const SWAP_EVENT_SIGNATURE = "Swap(address,uint256,uint256,uint256,uint256,address)";
const TOKEN_MAP: Record<string, string> = {
  BTC: "0x7290f72B5C67052DDE8e6E179F7803c493e90d3f",
  ETH: "0x0AFdAcD509e73115EA1654B1a770f1a807e7c9C0",
  USDT: "0xc63d2a04762529edB649d7a4cC3E57A0085e8544",
  XRP: "0x1a6a3e7Bb246158dF31d8f924B84D961669Ba4e5",
  BNB: "0x093e8F4d8f267d2CeEc9eB889E2054710d187beD",
  SOL: "0xBa3e08b4753E68952031102518379ED2fDADcA30",
  USDC: "0x34ee84036C47d852901b7069aBD80171D9A489a6",
  DOGE: "0xa85b028984bC54A2a3D844B070544F59dDDf89DE",
  ADA: "0xD499f5F7d3C918D0e553BA03954c4E02af16B6e4",
  TRX: "0xDadd1125B8Df98A66Abd5EB302C0d9Ca5A061dC2",
  LINK0: "0x23d351BA89eaAc4E328133Cb48e050064C219A1E",
  SUI: "0x35D2F51DBC8b401B11fA3FE04423E0f5cd9fEDb4",
  // add all test tokens used in your pools
};

export default function UniswapPage() {
  const [pools, setPools] = useState<{ address: string; name: string }[]>([]);
  const [selectedPair, setSelectedPair] = useState("");
  const [amount0, setAmount0] = useState("");
  const [amount1, setAmount1] = useState("");
  const [token0Symbol, setToken0Symbol] = useState("");
  const [token1Symbol, setToken1Symbol] = useState("");
  const [removeAmount, setRemoveAmount] = useState("");
  const [swapAmount, setSwapAmount] = useState("");
  const [swapDirection, setSwapDirection] = useState<"0to1" | "1to0">("0to1");
  const [reserves, setReserves] = useState<{ reserve0: bigint; reserve1: bigint } | null>(null);
  const [priceHistory, setPriceHistory] = useState<{ x: number; y: number }[]>([]);
  const [nlInput, setNlInput] = useState("");
  const [modelChoice, setModelChoice] = useState<"openai" | "oss">("openai");
  const [ossModelUrl, setOssModelUrl] = useState("");
  const [nlOutput, setNlOutput] = useState("");

  useEffect(() => {
    const fetchPools = async () => {
      try {
        if (!window.ethereum) {
          alert("Please install MetaMask to use this app.");
          return;
        }
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const factory = new ethers.Contract(FACTORY_ADDRESS, UniswapV2FactoryABI, signer);

        const poolCount = await factory.allPairsLength();
        const poolList = [];

        for (let i = 0; i < poolCount; i++) {
          const pairAddress = await factory.allPairs(i);
          const pair = new ethers.Contract(pairAddress, UniswapV2PairABI, signer);

          const token0 = await pair.token0();
          const token1 = await pair.token1();

          const token0Contract = new ethers.Contract(token0, ERC20ABI, signer);
          const token1Contract = new ethers.Contract(token1, ERC20ABI, signer);

          const symbol0 = await token0Contract.symbol();
          const symbol1 = await token1Contract.symbol();

          poolList.push({ address: pairAddress, name: `${symbol0} / ${symbol1}` });
        }

        setPools(poolList);
      } catch (err) {
        console.error("Error fetching pools:", err);
      }
    };

    fetchPools();
  }, []);
  async function handleNaturalLanguageSubmit() {
    try {
      const res = await fetch("/api/llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: nlInput,
          model: modelChoice,
          ossUrl: ossModelUrl,
        }),
      });

      const data = await res.json();
      setNlOutput(data.output || JSON.stringify(data));
      if (data.structured?.action) {
        handleStructuredAction(data.structured);
      }
    } catch (err) {
      console.error("NL processing error:", err);
      setNlOutput("❌ Failed to process prompt.");
    }
  }

  async function handleStructuredAction(structured: StructuredCommand) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const factory = new ethers.Contract(FACTORY_ADDRESS, UniswapV2FactoryABI, signer);

    switch (structured.action) {
      case "swap": {
        const tokenInAddr = TOKEN_MAP[structured.tokenIn];
        const tokenOutAddr = TOKEN_MAP[structured.tokenOut];

        if (!tokenInAddr || !tokenOutAddr) {
          alert("❌ Unknown token symbol");
          return;
        }

        const pairAddress = await factory.getPair(tokenInAddr, tokenOutAddr);
        const pair = new ethers.Contract(pairAddress, UniswapV2PairABI, signer);

        const tokenIn = new ethers.Contract(tokenInAddr, ERC20ABI, signer);
        const amountIn = ethers.parseUnits(structured.amount.toString(), 18);

        await tokenIn.approve(pair.target, amountIn);
        await tokenIn.transfer(pair.target, amountIn);

        const reserves = await pair.getReserves();
        const isToken0 = (await pair.token0()).toLowerCase() === tokenInAddr.toLowerCase();
        const reserveIn = isToken0 ? reserves[0] : reserves[1];
        const reserveOut = isToken0 ? reserves[1] : reserves[0];

        const amountInWithFee = amountIn * 997n;
        const numerator = amountInWithFee * reserveOut;
        const denominator = reserveIn * 1000n + amountInWithFee;
        const amountOut = numerator / denominator;

        const amount0Out = isToken0 ? 0n : amountOut;
        const amount1Out = isToken0 ? amountOut : 0n;

        const tx = await pair.swap(amount0Out, amount1Out, await signer.getAddress(), "0x");
        await tx.wait();

        alert(`✅ Swapped ${structured.amount} ${structured.tokenIn} → ${structured.tokenOut}`);
        break;
      }

      case "deposit": {
        for (const { token, amount } of structured.amounts) {
          const tokenAddr = TOKEN_MAP[token];
          if (!tokenAddr) {
            alert(`❌ Unknown token: ${token}`);
            return;
          }

          const tokenContract = new ethers.Contract(tokenAddr, ERC20ABI, signer);
          const amountIn = ethers.parseUnits(amount.toString(), 18);

          await tokenContract.approve(factory.target, amountIn);
          await tokenContract.transfer(factory.target, amountIn);
        }

        alert(`✅ Would call mint() on appropriate pair (manually implement if needed).`);
        break;
      }

      case "redeem": {
        const [token0Sym, token1Sym] = structured.pool;
        const token0 = TOKEN_MAP[token0Sym];
        const token1 = TOKEN_MAP[token1Sym];

        if (!token0 || !token1) {
          alert("❌ Unknown token symbols for pool");
          return;
        }

        const pairAddr = await factory.getPair(token0, token1);
        if (pairAddr === ethers.ZeroAddress) {
          alert("❌ No pair exists for that pool");
          return;
        }

        const pair = new ethers.Contract(pairAddr, UniswapV2PairABI, signer);
        const user = await signer.getAddress();
        const lpBalance = await pair.balanceOf(user);

        await pair.approve(pair.target, lpBalance);
        await pair.transfer(pair.target, lpBalance);

        const tx = await pair.burn(user);
        await tx.wait();

        alert("✅ Liquidity removed!");
        break;
      }

      case "query": {
        const [token0Sym, token1Sym] = structured.pool;
        const token0 = TOKEN_MAP[token0Sym];
        const token1 = TOKEN_MAP[token1Sym];

        if (!token0 || !token1) {
          alert("❌ Unknown token symbols for query");
          return;
        }

        const pairAddr = await factory.getPair(token0, token1);
        if (pairAddr === ethers.ZeroAddress) {
          alert("❌ No pool exists for that pair");
          return;
        }

        const pair = new ethers.Contract(pairAddr, UniswapV2PairABI, signer);
        const [reserve0, reserve1] = await pair.getReserves();

        alert(`📊 Reserves for ${token0Sym}/${token1Sym}:\n${reserve0} / ${reserve1}`);
        break;
      }

      default:
        alert("❌ Unknown action type");
    }
  }

  const handleSelectPair = async (address: string) => {
    setSelectedPair(address);
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const pair = new ethers.Contract(address, UniswapV2PairABI, signer);
    const token0 = await pair.token0();
    const token1 = await pair.token1();
    const token0Contract = new ethers.Contract(token0, ERC20ABI, signer);
    const token1Contract = new ethers.Contract(token1, ERC20ABI, signer);
    const symbol0 = await token0Contract.symbol();
    const symbol1 = await token1Contract.symbol();
    const reserves = await pair.getReserves();
    await fetchSwapEvents(address);

    setReserves({ reserve0: reserves[0], reserve1: reserves[1] });

    setToken0Symbol(symbol0);
    setToken1Symbol(symbol1);
  };

  async function fetchSwapEvents(pairAddress: string) {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const iface = new ethers.Interface(UniswapV2PairABI);

      const logs = await provider.send("eth_getLogs", [
        {
          address: pairAddress,
          fromBlock: "0x0",
          toBlock: "latest",
          topics: [ethers.id(SWAP_EVENT_SIGNATURE)],
        },
      ]);

      const parsed = logs.map((log: ethers.Log) => iface.parseLog(log));

      const prices = parsed.map((e: ethers.LogDescription, i: number) => {
        const { amount0In, amount1In, amount0Out, amount1Out } = e.args as unknown as {
          amount0In: bigint;
          amount1In: bigint;
          amount0Out: bigint;
          amount1Out: bigint;
        };

        const input = amount0In > 0n ? amount0In : amount1In;
        const output = amount0Out > 0n ? amount0Out : amount1Out;

        const price = Number(output) / Number(input);

        return { x: i + 1, y: price };
      });

      setPriceHistory(prices);
    } catch (err) {
      console.error("Swap log fetch failed:", err);
    }
  }

  const handleAddLiquidity = async () => {
    try {
      if (!selectedPair || selectedPair === "") {
        alert("Please select a valid pool before proceeding.");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const pair = new ethers.Contract(selectedPair, UniswapV2PairABI, signer);
      const token0Addr = await pair.token0();
      const token1Addr = await pair.token1();

      const token0 = new ethers.Contract(token0Addr, ERC20ABI, signer);
      const token1 = new ethers.Contract(token1Addr, ERC20ABI, signer);

      const amt0 = ethers.parseUnits(amount0, 18);
      const amt1 = ethers.parseUnits(amount1, 18);

      // Approve tokens to the pair
      await token0.approve(pair.target, amt0);
      await token1.approve(pair.target, amt1);

      // Transfer tokens to the pair
      await token0.transfer(pair.target, amt0);
      await token1.transfer(pair.target, amt1);

      // Call mint
      const tx = await pair.mint(await signer.getAddress());
      await tx.wait();

      alert("✅ Liquidity added!");
    } catch (err) {
      console.error("Add liquidity failed:", err);
      alert("❌ Liquidity addition failed.");
    }
  };
  async function handleRemoveLiquidity() {
    try {
      if (!selectedPair || selectedPair === "") {
        alert("Please select a valid pool before proceeding.");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const pair = new ethers.Contract(selectedPair, UniswapV2PairABI, signer);

      const lpAmount = ethers.parseUnits(removeAmount, 18);
      const balance = await pair.balanceOf(await signer.getAddress());

      if (lpAmount > balance) {
        alert("You don't have that many LP tokens.");
        return;
      }

      // Approve pair to spend LP tokens
      await pair.approve(pair.target, lpAmount);

      // Transfer LP tokens to the pair contract
      await pair.transfer(pair.target, lpAmount);

      // Call burn
      const tx = await pair.burn(await signer.getAddress());
      await tx.wait();

      alert("✅ Liquidity removed!");
    } catch (err) {
      console.error("Remove liquidity failed:", err);
      alert("❌ Liquidity removal failed.");
    }
  }
  async function handleSwap() {
    try {
      if (!selectedPair || selectedPair === "") {
        alert("Please select a valid pool before proceeding.");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const user = await signer.getAddress();

      const pair = new ethers.Contract(selectedPair, UniswapV2PairABI, signer);

      const token0 = new ethers.Contract(await pair.token0(), ERC20ABI, signer);
      const token1 = new ethers.Contract(await pair.token1(), ERC20ABI, signer);

      const amountIn = ethers.parseUnits(swapAmount, 18);

      // Determine direction
      const inputToken = swapDirection === "0to1" ? token0 : token1;

      const reserves = await pair.getReserves();
      const reserveIn = swapDirection === "0to1" ? reserves[0] : reserves[1];
      const reserveOut = swapDirection === "0to1" ? reserves[1] : reserves[0];

      // Uniswap formula with 0.3% fee
      const amountInWithFee = amountIn * 997n;
      const numerator = amountInWithFee * reserveOut;
      const denominator = reserveIn * 1000n + amountInWithFee;
      const amountOut = numerator / denominator;

      const amount0Out = swapDirection === "0to1" ? 0n : amountOut;
      const amount1Out = swapDirection === "0to1" ? amountOut : 0n;

      // Approve token
      await inputToken.approve(pair.target, amountIn);

      // Transfer input token to pair
      await inputToken.transfer(pair.target, amountIn);

      // Call swap
      const tx = await pair.swap(amount0Out, amount1Out, user, "0x");
      await tx.wait();
      await fetchSwapEvents(selectedPair);

      alert(`✅ Swapped! Received ${ethers.formatUnits(amountOut, 18)} tokens`);
    } catch (err) {
      console.error("Swap failed:", err);
      alert("❌ Swap failed. Check console.");
    }
  }

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold mb-6">🦄 Uniswap v2 Web3 UI</h1>
      <div className="mt-10 p-4 border rounded ">
        <h2 className="text-xl font-semibold mb-2">💬 Natural Language Commands</h2>

        <textarea
          className="border p-2 w-full rounded mb-2"
          rows={3}
          placeholder='e.g. "swap 10 USDC for ETH"'
          value={nlInput}
          onChange={e => setNlInput(e.target.value)}
        />

        <div className="flex flex-col gap-2 mb-2">
          <label className="font-medium">Choose Model:</label>
          <select
            className="border p-2 rounded"
            value={modelChoice}
            onChange={e => setModelChoice(e.target.value as "openai" | "oss")}
          >
            <option value="openai">OpenAI</option>
            <option value="oss">Open Source (Custom URL)</option>
          </select>

          {modelChoice === "oss" && (
            <input
              className="border p-2 rounded"
              placeholder="Enter OSS model endpoint URL"
              value={ossModelUrl}
              onChange={e => setOssModelUrl(e.target.value)}
            />
          )}
        </div>

        <button className="bg-purple-600 text-white px-4 py-2 rounded" onClick={handleNaturalLanguageSubmit}>
          ✨ Submit
        </button>

        {nlOutput && (
          <div className="mt-4 p-3 bg-black border rounded">
            <strong>Model Response:</strong>
            <pre className="whitespace-pre-wrap">{nlOutput}</pre>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="block font-semibold mb-2">Select a Pool:</label>
          <select
            className="border px-4 py-2 rounded w-full"
            value={selectedPair}
            onChange={e => handleSelectPair(e.target.value)}
          >
            <option value="">Select...</option>
            {pools.map(pool => (
              <option key={pool.address} value={pool.address}>
                {pool.name}
              </option>
            ))}
          </select>
        </div>

        {selectedPair && (
          <div className="space-y-4 mt-4">
            <div>
              <label className="block font-medium">Amount {token0Symbol}:</label>
              <input
                type="text"
                value={amount0}
                onChange={e => setAmount0(e.target.value)}
                className="border px-2 py-1 rounded w-full"
              />
            </div>
            <div>
              <label className="block font-medium">Amount {token1Symbol}:</label>
              <input
                type="text"
                value={amount1}
                onChange={e => setAmount1(e.target.value)}
                className="border px-2 py-1 rounded w-full"
              />
            </div>

            <button onClick={handleAddLiquidity} className="bg-blue-600 text-white px-4 py-2 rounded w-full">
              Approve & Add Liquidity
            </button>
            <div className="mt-10 border-t pt-6">
              <h2 className="text-xl font-semibold mb-2">Remove Liquidity</h2>

              <label className="block font-medium mb-1">LP Token Amount:</label>
              <input
                type="text"
                value={removeAmount}
                onChange={e => setRemoveAmount(e.target.value)}
                className="border px-2 py-1 rounded w-full mb-4"
              />

              <button
                className="bg-red-600 text-white px-4 py-2 rounded w-full"
                onClick={handleRemoveLiquidity}
                disabled={!selectedPair}
              >
                Burn LP Tokens
              </button>
            </div>
            <div className="mt-10 border-t pt-6">
              <h2 className="text-xl font-semibold mb-2">Swap Tokens</h2>

              <div className="mb-4">
                <label className="block mb-1 font-medium">Swap Direction:</label>
                <select
                  className="border px-2 py-1 rounded w-full"
                  value={swapDirection}
                  onChange={e => setSwapDirection(e.target.value as "0to1" | "1to0")}
                >
                  <option value="0to1">
                    {token0Symbol} → {token1Symbol}
                  </option>
                  <option value="1to0">
                    {token1Symbol} → {token0Symbol}
                  </option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block font-medium mb-1">Input Amount:</label>
                <input
                  type="text"
                  value={swapAmount}
                  onChange={e => setSwapAmount(e.target.value)}
                  className="border px-2 py-1 rounded w-full"
                />
              </div>

              <button onClick={handleSwap} className="bg-green-600 text-white px-4 py-2 rounded w-full">
                Swap
              </button>
            </div>
            {reserves && (
              <div className="mt-10">
                <h2 className="text-xl font-semibold mb-4">📈 Reserve Curve</h2>
                <ResponsiveContainer width="100%" height={400}>
                  <ScatterChart>
                    <CartesianGrid stroke="#ccc" />
                    <XAxis type="number" dataKey="x" />
                    <YAxis type="number" dataKey="y" />
                    <Tooltip />

                    {/* Curve */}
                    <Line
                      type="monotone"
                      data={generateCurveData(reserves.reserve0 * reserves.reserve1)}
                      dataKey="y"
                      stroke="#8884d8"
                      dot={false}
                    />

                    {/* Current point */}
                    <Scatter
                      data={[
                        {
                          x: Number(ethers.formatUnits(reserves.reserve0, 18)),
                          y: Number(ethers.formatUnits(reserves.reserve1, 18)),
                        },
                      ]}
                      fill="#FF0000"
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            )}
            {priceHistory.length > 0 && (
              <div className="mt-10">
                <h2 className="text-xl font-semibold mb-4">📊 Swap Price History</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={priceHistory}>
                    <XAxis dataKey="x" label={{ value: "Swap #", position: "insideBottomRight", offset: -5 }} />
                    <YAxis domain={["auto", "auto"]} label={{ value: "Price", angle: -90, position: "insideLeft" }} />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Tooltip />
                    <Line type="monotone" dataKey="y" stroke="#82ca9d" dot />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
function generateCurveData(k: bigint): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const min = 1;
  const max = 100;

  for (let x = min; x <= max; x += 1) {
    const y = Number(k) / x;
    if (y > 0 && y < 100000) {
      points.push({ x, y });
    }
  }

  return points;
}
