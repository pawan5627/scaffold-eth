"use client";

import { useEffect, useState } from "react";
import ERC20ABI from "../../lib/abi/ERC20.json";
import UniswapV2FactoryABI from "../../lib/abi/UniswapV2Factory.json";
import UniswapV2PairABI from "../../lib/abi/UniswapV2Pair.json";
import { ethers } from "ethers";

const FACTORY_ADDRESS = "0x0165878A594ca255338adfa4d48449f69242Eb8F";

export default function UniswapPage() {
  const [pools, setPools] = useState<{ address: string; name: string }[]>([]);

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

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold mb-6">🦄 Uniswap v2 Web3 UI</h1>

      <div className="mt-6">
        <label className="block font-semibold mb-2">Select a Pool:</label>
        <select className="border px-4 py-2 rounded w-full">
          {pools.map(pool => (
            <option key={pool.address} value={pool.address}>
              {pool.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
