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
        string[6] memory names = ["Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta"];
        string[6] memory symbols = ["A", "B", "G", "D", "E", "Z"];

        for (uint i = 0; i < 6; i++) {
            tokens[2 * i] = new ERC20Mock(names[i], symbols[i], 18);
            tokens[2 * i + 1] = new ERC20Mock(string.concat(names[i], "X"), string.concat(symbols[i], "X"), 18);
        }

        // Create pairs
        for (uint i = 0; i < 6; i++) {
            address pair = factory.createPair(address(tokens[2 * i]), address(tokens[2 * i + 1]));
            console2.log("Pair", i + 1, ":", pair);
        }

        vm.stopBroadcast();
    }
}
