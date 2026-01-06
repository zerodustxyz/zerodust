// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { Script, console2 } from "forge-std/Script.sol";
import { ZeroDustSweep } from "../src/ZeroDustSweep.sol";

/**
 * @title Deploy
 * @notice Deployment script for ZeroDustSweep contract
 * @dev Uses CREATE2 for deterministic addresses across all chains
 *
 * Usage:
 *   forge script script/Deploy.s.sol:Deploy --rpc-url $RPC_URL --broadcast --verify
 *
 * Environment variables:
 *   - PRIVATE_KEY: Deployer private key
 *   - ETHERSCAN_API_KEY: For contract verification (chain-specific)
 */
contract Deploy is Script {
    /// @notice Salt for CREATE2 deployment (ensures same address across chains)
    bytes32 public constant DEPLOY_SALT = bytes32(uint256(0x5a65726f44757374)); // "ZeroDust" in hex

    function run() public returns (ZeroDustSweep sweep) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console2.log("Deployer:", deployer);
        console2.log("Chain ID:", block.chainid);
        console2.log("Salt:", vm.toString(DEPLOY_SALT));

        // Compute expected address using inherited function
        bytes memory bytecode = type(ZeroDustSweep).creationCode;
        bytes32 bytecodeHash = keccak256(bytecode);
        address expectedAddress = computeCreate2Address(DEPLOY_SALT, bytecodeHash, CREATE2_FACTORY);
        console2.log("Expected address:", expectedAddress);

        // Check if already deployed
        if (expectedAddress.code.length > 0) {
            console2.log("Contract already deployed at:", expectedAddress);
            return ZeroDustSweep(payable(expectedAddress));
        }

        vm.startBroadcast(deployerPrivateKey);

        // Deploy using CREATE2 factory
        bytes memory deployData = abi.encodePacked(DEPLOY_SALT, bytecode);
        (bool success,) = CREATE2_FACTORY.call(deployData);
        require(success, "CREATE2 deployment failed");

        vm.stopBroadcast();

        // Verify deployment
        require(expectedAddress.code.length > 0, "Deployment verification failed");

        sweep = ZeroDustSweep(payable(expectedAddress));
        console2.log("Deployed ZeroDustSweep at:", address(sweep));
        console2.log("Domain Separator:", vm.toString(sweep.DOMAIN_SEPARATOR()));

        return sweep;
    }
}

/**
 * @title DeploySimple
 * @notice Simple deployment without CREATE2 (for testing or chains without the factory)
 */
contract DeploySimple is Script {
    function run() public returns (ZeroDustSweep sweep) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console2.log("Deployer:", deployer);
        console2.log("Chain ID:", block.chainid);

        vm.startBroadcast(deployerPrivateKey);

        sweep = new ZeroDustSweep();

        vm.stopBroadcast();

        console2.log("Deployed ZeroDustSweep at:", address(sweep));
        console2.log("Domain Separator:", vm.toString(sweep.DOMAIN_SEPARATOR()));

        return sweep;
    }
}

/**
 * @title ComputeAddress
 * @notice Utility to compute the deterministic address without deploying
 */
contract ComputeAddress is Script {
    bytes32 public constant DEPLOY_SALT = bytes32(uint256(0x5a65726f44757374));

    function run() public view {
        bytes memory bytecode = type(ZeroDustSweep).creationCode;
        bytes32 bytecodeHash = keccak256(bytecode);

        address expectedAddress = computeCreate2Address(DEPLOY_SALT, bytecodeHash, CREATE2_FACTORY);

        console2.log("Chain ID:", block.chainid);
        console2.log("Salt:", vm.toString(DEPLOY_SALT));
        console2.log("Bytecode hash:", vm.toString(bytecodeHash));
        console2.log("Expected ZeroDustSweep address:", expectedAddress);

        if (expectedAddress.code.length > 0) {
            console2.log("Status: DEPLOYED");
            ZeroDustSweep sweep = ZeroDustSweep(payable(expectedAddress));
            console2.log("Domain Separator:", vm.toString(sweep.DOMAIN_SEPARATOR()));
        } else {
            console2.log("Status: NOT DEPLOYED");
        }
    }
}
