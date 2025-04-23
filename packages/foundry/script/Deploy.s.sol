// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/UniswapV2Factory.sol";

contract Deploy is Script {
    function run() external {
        vm.startBroadcast();

        UniswapV2Factory factory = new UniswapV2Factory(msg.sender);
        console2.log("Factory address:", address(factory));

        vm.stopBroadcast();
    }
}
