"use client";

import { useEffect, useState } from "react";
import ERC20ABI from "../../lib/abi/ERC20.json";
import UniswapV2FactoryABI from "../../lib/abi/UniswapV2Factory.json";
import UniswapV2PairABI from "../../lib/abi/UniswapV2Pair.json";
import { ethers } from "ethers";

const FACTORY_ADDRESS = "0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82";

export default function UniswapPage() {
  const [pools, setPools] = useState<{ address: string; name: string }[]>([]);
  const [selectedPair, setSelectedPair] = useState("");
  const [amount0, setAmount0] = useState("");
  const [amount1, setAmount1] = useState("");
  const [token0Symbol, setToken0Symbol] = useState("");
  const [token1Symbol, setToken1Symbol] = useState("");

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
    setToken0Symbol(symbol0);
    setToken1Symbol(symbol1);
  };

  const handleAddLiquidity = async () => {
    try {
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

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold mb-6">🦄 Uniswap v2 Web3 UI</h1>

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
          </div>
        )}
      </div>
    </div>
  );
}
