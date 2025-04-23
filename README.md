# 🦄 Uniswap v2 Web3 UI  
**INFO7500 – Spring 2025**  
Built by [Pawan Kumar](https://github.com/pawan5627)

This project is a full-featured Web3 frontend built using [Scaffold-ETH v2](https://github.com/scaffold-eth/scaffold-eth-2) to interact with Uniswap v2 smart contracts, upgraded and extended for Homework 6.

---

## ✨ Features

- ✅ Pool selection from deployed UniswapV2Factory contract
- ✅ Add and remove liquidity (mint/burn LP tokens)
- ✅ Token swap (0 → 1 and 1 → 0 directions)
- ✅ 📈 Live **reserve curve** chart (`x * y = k`)
- ✅ 📊 **Swap execution price** history chart (based on Swap events)
- ✅ Works locally with Anvil + Foundry

---

## 🧠 Tech Stack

- ⚙️ Foundry (Solidity contracts + scripts)
- 🌐 Next.js (frontend)
- 🔌 Ethers.js v6
- 🎨 Recharts (visualizations)
- 🔁 Anvil (local dev chain)
- 🚀 Vercel (optional deployment)

---

## 📦 Getting Started

### Clone the project

```bash
git clone https://github.com/pawan5627/scaffold-eth.git
cd scaffold-eth
```

### Install frontend dependencies

```bash
cd packages/nextjs
yarn install
```

### Start Anvil locally

```bash
cd packages/foundry
anvil
```

### Deploy contracts

```bash
forge script script/Deploy.s.sol:Deploy --rpc-url http://localhost:8545 --broadcast --private-key <ANVIL_PRIVATE_KEY>
```

### Run frontend

```bash
cd packages/nextjs
yarn dev
```

App will be available at: [http://localhost:3000/uniswap](http://localhost:3000/uniswap)

---

## 🧪 How to Test

- Use pool selector to choose a UniswapV2Pair
- Add liquidity using `Add Liquidity` form
- Try swapping token0 → token1 and vice versa
- Remove liquidity using `Burn LP Tokens`
- Charts will update automatically after each action

---

## 📁 Repository Structure

```
/packages
  /foundry       ← Smart contracts (Uniswap V2)
  /nextjs        ← Frontend (Scaffold-ETH v2 + UI)
```

### `.gitignore` automatically excludes:

- `node_modules`
- `.next`
- `.yarn`
- `out/`
- `.DS_Store`

---

## 📸 Demo Screenshots

> Add screenshots here after deployment:
> `packages/nextjs/public/demo.png`

---

## 🔗 Live URL (optional)

Deployed on [Vercel](https://vercel.com/)  
➡️ `https://scaffold-eth-nine.vercel.app/`

---

## 👨‍💻 Author

- **Pawan Kumar**
- INFO7500 – Northeastern University
- GitHub: [pawan5627](https://github.com/pawan5627)

---

## 📝 License

MIT