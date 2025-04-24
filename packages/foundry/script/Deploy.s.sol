// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/UniswapV2Factory.sol";
import {ERC20Mock} from "../contracts/mocks/ERC20Mock.sol";


contract Deploy is Script {
    function run() external {
        vm.startBroadcast();

        // Deploy factory
        UniswapV2Factory factory = new UniswapV2Factory(msg.sender);
        console2.log("Factory:", address(factory));

        // Create tokens
        ERC20Mock[12] memory tokens;
        string[12] memory names = ["Bitcoin", "Ethereum", "Tether", "XRP", "BNB", "Solana","USDC","Dogecoin","Cardano","TRON","Chainlink","Sui"];
        string[12] memory symbols = ["BTC","ETH", "USDT","XRP", "BNB","SOL", "USDC","DOGE", "ADA","TRX", "LINK","SUI"];

        for (uint i = 0; i < 12; i++) {
            tokens[i] = new ERC20Mock(names[i], symbols[i], 18);
    
        }
        address testUser = address(0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266); // or your frontend wallet

for (uint i = 0; i < 12; i++) {
    tokens[i].transfer(testUser, 100_000 ether);
}
for (uint i = 0; i < 12; i++) {
    console2.log("Token", i, ":", address(tokens[i]));
}
        // Create pairs
for (uint i = 0; i < 6; i++) {
  for (uint j = i + 1; j < 6; j++) {
    factory.createPair(address(tokens[2 * i]), address(tokens[2 * j]));
  }
}


        vm.stopBroadcast();
    }
}
