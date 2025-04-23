// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/UniswapV2Factory.sol";
import "../contracts/UniswapV2ERC20.sol";
import {ERC20Mock} from "../contracts/mocks/ERC20Mock.sol";

contract DeployTokensAndPair is Script {
    function run() external {
        vm.startBroadcast();

        // Deploy test tokens
        ERC20Mock tokenA = new ERC20Mock("TestA", "TKA", 18);
        ERC20Mock tokenB = new ERC20Mock("TestB", "TKB", 18);
        console2.log("Token A:", address(tokenA));
        console2.log("Token B:", address(tokenB));

        // Deploy factory
        UniswapV2Factory factory = new UniswapV2Factory(msg.sender);
        console2.log("Factory:", address(factory));

        // Create pair
        address pair = factory.createPair(address(tokenA), address(tokenB));
        console2.log("Pair:", pair);

        vm.stopBroadcast();
    }
}
