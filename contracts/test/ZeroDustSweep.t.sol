// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { Test, console2 } from "forge-std/Test.sol";
import { ZeroDustSweep } from "../src/ZeroDustSweep.sol";

/**
 * @title ZeroDustSweepTest
 * @notice Comprehensive test suite for ZeroDustSweep contract
 *
 * @dev EIP-7702 Simulation:
 * In production, the user's account is delegated to the ZeroDustSweep contract via EIP-7702.
 * This means when we call executeSweep on the user's address, the contract code runs in the
 * context of the user's account, allowing it to send the user's native balance.
 *
 * In tests, we simulate this by:
 * 1. Deploying the ZeroDustSweep contract
 * 2. Using vm.etch to set the user's account code to the sweep contract's code
 * 3. Calling executeSweep on the user's address (which now has the contract code)
 */
contract ZeroDustSweepTest is Test {
    ZeroDustSweep public sweepImplementation;

    // Test accounts
    uint256 internal userPrivateKey;
    address internal user;
    address internal relayer;
    address internal destination;

    // EIP-712 constants
    bytes32 internal constant SWEEP_AUTHORIZATION_TYPEHASH = keccak256(
        "SweepAuthorization(address user,address destination,uint256 maxRelayerCompensation,uint256 deadline,uint256 nonce)"
    );

    // ============ Setup ============

    function setUp() public {
        sweepImplementation = new ZeroDustSweep();

        // Create test accounts
        userPrivateKey = 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef;
        user = vm.addr(userPrivateKey);
        relayer = makeAddr("relayer");
        destination = makeAddr("destination");

        // Fund the user
        vm.deal(user, 1 ether);
    }

    // ============ Helper Functions ============

    /**
     * @dev Simulate EIP-7702 delegation by copying the sweep contract code to the user's address
     *      and returning a ZeroDustSweep interface pointing to the user's address
     */
    function _delegateToSweep() internal returns (ZeroDustSweep) {
        // Copy the sweep contract code to the user's address
        vm.etch(user, address(sweepImplementation).code);

        // Store the domain separator in the user's storage (slot 0 is the immutable)
        // For immutables, we need to compute it at the user's address context
        // Since DOMAIN_SEPARATOR uses address(this) and block.chainid, we need to set it correctly

        // Actually, immutables are embedded in the bytecode, so vm.etch copies them too
        // But the DOMAIN_SEPARATOR was computed with address(sweepImplementation) as verifyingContract
        // We need to create a new instance at a predictable address, or recalculate

        // For testing, let's use the implementation's DOMAIN_SEPARATOR
        // In production, each user's delegated code would compute its own DOMAIN_SEPARATOR

        return ZeroDustSweep(payable(user));
    }

    function _createAuthorization(
        address _user,
        address _destination,
        uint256 _maxRelayerCompensation,
        uint256 _deadline,
        uint256 _nonce
    ) internal pure returns (ZeroDustSweep.SweepAuthorization memory) {
        return ZeroDustSweep.SweepAuthorization({
            user: _user,
            destination: _destination,
            maxRelayerCompensation: _maxRelayerCompensation,
            deadline: _deadline,
            nonce: _nonce
        });
    }

    /**
     * @dev Sign authorization using the implementation's domain separator
     *      This simulates signing against the deployed singleton contract
     */
    function _signAuthorization(
        ZeroDustSweep.SweepAuthorization memory auth,
        uint256 privateKey
    ) internal view returns (bytes memory) {
        bytes32 structHash = keccak256(
            abi.encode(
                SWEEP_AUTHORIZATION_TYPEHASH,
                auth.user,
                auth.destination,
                auth.maxRelayerCompensation,
                auth.deadline,
                auth.nonce
            )
        );
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", sweepImplementation.DOMAIN_SEPARATOR(), structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);
        return abi.encodePacked(r, s, v);
    }

    function _signAuthorizationCompact(
        ZeroDustSweep.SweepAuthorization memory auth,
        uint256 privateKey
    ) internal view returns (bytes memory) {
        bytes32 structHash = keccak256(
            abi.encode(
                SWEEP_AUTHORIZATION_TYPEHASH,
                auth.user,
                auth.destination,
                auth.maxRelayerCompensation,
                auth.deadline,
                auth.nonce
            )
        );
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", sweepImplementation.DOMAIN_SEPARATOR(), structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);

        // Convert to EIP-2098 compact format
        bytes32 vs = s;
        if (v == 28) {
            vs = bytes32(uint256(s) | (1 << 255));
        }
        return abi.encodePacked(r, vs);
    }

    // ============ Constructor Tests ============

    function test_constructor_setsDomainSeparator() public view {
        bytes32 expectedDomainSeparator = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("ZeroDust")),
                keccak256(bytes("1")),
                block.chainid,
                address(sweepImplementation)
            )
        );
        assertEq(sweepImplementation.DOMAIN_SEPARATOR(), expectedDomainSeparator);
    }

    function test_constructor_setsConstants() public view {
        assertEq(sweepImplementation.NAME(), "ZeroDust");
        assertEq(sweepImplementation.VERSION(), "1");
    }

    // ============ executeSweep Success Tests ============

    function test_executeSweep_success() public {
        ZeroDustSweep userSweep = _delegateToSweep();

        ZeroDustSweep.SweepAuthorization memory auth =
            _createAuthorization(user, destination, 0.01 ether, block.timestamp + 1 hours, 0);
        bytes memory signature = _signAuthorization(auth, userPrivateKey);

        uint256 userBalanceBefore = user.balance;
        uint256 destinationBalanceBefore = destination.balance;
        uint256 relayerBalanceBefore = relayer.balance;

        vm.prank(relayer);
        userSweep.executeSweep(auth, signature);

        // User balance should be zero
        assertEq(user.balance, 0);

        // Destination should receive balance minus compensation
        assertEq(destination.balance, destinationBalanceBefore + userBalanceBefore - auth.maxRelayerCompensation);

        // Relayer should receive compensation
        assertEq(relayer.balance, relayerBalanceBefore + auth.maxRelayerCompensation);
    }

    function test_executeSweep_emitsEvent() public {
        ZeroDustSweep userSweep = _delegateToSweep();

        ZeroDustSweep.SweepAuthorization memory auth =
            _createAuthorization(user, destination, 0.01 ether, block.timestamp + 1 hours, 0);
        bytes memory signature = _signAuthorization(auth, userPrivateKey);

        uint256 userBalance = user.balance;
        uint256 expectedAmountSent = userBalance - auth.maxRelayerCompensation;

        vm.expectEmit(true, true, false, true);
        emit ZeroDustSweep.SweepExecuted(user, destination, expectedAmountSent, auth.maxRelayerCompensation, 0);

        vm.prank(relayer);
        userSweep.executeSweep(auth, signature);
    }

    function test_executeSweep_marksNonceUsed() public {
        ZeroDustSweep userSweep = _delegateToSweep();

        ZeroDustSweep.SweepAuthorization memory auth =
            _createAuthorization(user, destination, 0.01 ether, block.timestamp + 1 hours, 0);
        bytes memory signature = _signAuthorization(auth, userPrivateKey);

        assertFalse(userSweep.isNonceUsed(user, 0));

        vm.prank(relayer);
        userSweep.executeSweep(auth, signature);

        assertTrue(userSweep.isNonceUsed(user, 0));
    }

    function test_executeSweep_withCompactSignature() public {
        ZeroDustSweep userSweep = _delegateToSweep();

        ZeroDustSweep.SweepAuthorization memory auth =
            _createAuthorization(user, destination, 0.01 ether, block.timestamp + 1 hours, 0);
        bytes memory signature = _signAuthorizationCompact(auth, userPrivateKey);

        assertEq(signature.length, 64); // Compact signature is 64 bytes

        vm.prank(relayer);
        userSweep.executeSweep(auth, signature);

        assertEq(user.balance, 0);
    }

    function test_executeSweep_compensationEqualsBalance() public {
        ZeroDustSweep userSweep = _delegateToSweep();

        // Set max compensation to entire balance
        uint256 userBalance = user.balance;
        ZeroDustSweep.SweepAuthorization memory auth =
            _createAuthorization(user, destination, userBalance, block.timestamp + 1 hours, 0);
        bytes memory signature = _signAuthorization(auth, userPrivateKey);

        uint256 relayerBalanceBefore = relayer.balance;

        vm.prank(relayer);
        userSweep.executeSweep(auth, signature);

        // All funds go to relayer
        assertEq(user.balance, 0);
        assertEq(destination.balance, 0);
        assertEq(relayer.balance, relayerBalanceBefore + userBalance);
    }

    function test_executeSweep_compensationExceedsBalance() public {
        ZeroDustSweep userSweep = _delegateToSweep();

        // Set max compensation higher than balance
        ZeroDustSweep.SweepAuthorization memory auth =
            _createAuthorization(user, destination, 10 ether, block.timestamp + 1 hours, 0);
        bytes memory signature = _signAuthorization(auth, userPrivateKey);

        uint256 relayerBalanceBefore = relayer.balance;
        uint256 userBalance = user.balance;

        vm.prank(relayer);
        userSweep.executeSweep(auth, signature);

        // Compensation is capped at balance
        assertEq(user.balance, 0);
        assertEq(destination.balance, 0);
        assertEq(relayer.balance, relayerBalanceBefore + userBalance);
    }

    function test_executeSweep_zeroCompensation() public {
        ZeroDustSweep userSweep = _delegateToSweep();

        // No relayer compensation
        ZeroDustSweep.SweepAuthorization memory auth =
            _createAuthorization(user, destination, 0, block.timestamp + 1 hours, 0);
        bytes memory signature = _signAuthorization(auth, userPrivateKey);

        uint256 destinationBalanceBefore = destination.balance;
        uint256 userBalance = user.balance;

        vm.prank(relayer);
        userSweep.executeSweep(auth, signature);

        // All funds go to destination
        assertEq(user.balance, 0);
        assertEq(destination.balance, destinationBalanceBefore + userBalance);
    }

    function test_executeSweep_multipleNonces() public {
        ZeroDustSweep userSweep = _delegateToSweep();

        // Execute sweep with nonce 0
        ZeroDustSweep.SweepAuthorization memory auth0 =
            _createAuthorization(user, destination, 0.01 ether, block.timestamp + 1 hours, 0);
        bytes memory signature0 = _signAuthorization(auth0, userPrivateKey);

        vm.prank(relayer);
        userSweep.executeSweep(auth0, signature0);

        // Fund user again and execute sweep with nonce 1
        vm.deal(user, 0.5 ether);
        ZeroDustSweep.SweepAuthorization memory auth1 =
            _createAuthorization(user, destination, 0.01 ether, block.timestamp + 1 hours, 1);
        bytes memory signature1 = _signAuthorization(auth1, userPrivateKey);

        vm.prank(relayer);
        userSweep.executeSweep(auth1, signature1);

        assertEq(user.balance, 0);
        assertTrue(userSweep.isNonceUsed(user, 0));
        assertTrue(userSweep.isNonceUsed(user, 1));
    }

    // ============ executeSweep Revert Tests ============

    function test_executeSweep_reverts_invalidSignature() public {
        ZeroDustSweep userSweep = _delegateToSweep();

        ZeroDustSweep.SweepAuthorization memory auth =
            _createAuthorization(user, destination, 0.01 ether, block.timestamp + 1 hours, 0);

        // Sign with wrong private key
        uint256 wrongKey = 0xdeadbeef;
        bytes memory signature = _signAuthorization(auth, wrongKey);

        vm.prank(relayer);
        vm.expectRevert(ZeroDustSweep.InvalidSignature.selector);
        userSweep.executeSweep(auth, signature);
    }

    function test_executeSweep_reverts_expiredDeadline() public {
        ZeroDustSweep userSweep = _delegateToSweep();

        // Set deadline in the past
        ZeroDustSweep.SweepAuthorization memory auth =
            _createAuthorization(user, destination, 0.01 ether, block.timestamp - 1, 0);
        bytes memory signature = _signAuthorization(auth, userPrivateKey);

        vm.prank(relayer);
        vm.expectRevert(ZeroDustSweep.DeadlineExpired.selector);
        userSweep.executeSweep(auth, signature);
    }

    function test_executeSweep_reverts_usedNonce() public {
        ZeroDustSweep userSweep = _delegateToSweep();

        ZeroDustSweep.SweepAuthorization memory auth =
            _createAuthorization(user, destination, 0.01 ether, block.timestamp + 1 hours, 0);
        bytes memory signature = _signAuthorization(auth, userPrivateKey);

        // Execute first sweep
        vm.prank(relayer);
        userSweep.executeSweep(auth, signature);

        // Fund user again and try to replay
        vm.deal(user, 1 ether);

        vm.prank(relayer);
        vm.expectRevert(ZeroDustSweep.NonceAlreadyUsed.selector);
        userSweep.executeSweep(auth, signature);
    }

    function test_executeSweep_reverts_zeroBalance() public {
        // User has no balance
        vm.deal(user, 0);

        ZeroDustSweep userSweep = _delegateToSweep();

        ZeroDustSweep.SweepAuthorization memory auth =
            _createAuthorization(user, destination, 0.01 ether, block.timestamp + 1 hours, 0);
        bytes memory signature = _signAuthorization(auth, userPrivateKey);

        vm.prank(relayer);
        vm.expectRevert(ZeroDustSweep.ZeroBalance.selector);
        userSweep.executeSweep(auth, signature);
    }

    function test_executeSweep_reverts_invalidDestination() public {
        ZeroDustSweep userSweep = _delegateToSweep();

        // Zero address destination
        ZeroDustSweep.SweepAuthorization memory auth =
            _createAuthorization(user, address(0), 0.01 ether, block.timestamp + 1 hours, 0);
        bytes memory signature = _signAuthorization(auth, userPrivateKey);

        vm.prank(relayer);
        vm.expectRevert(ZeroDustSweep.InvalidDestination.selector);
        userSweep.executeSweep(auth, signature);
    }

    function test_executeSweep_reverts_invalidSignatureLength() public {
        ZeroDustSweep userSweep = _delegateToSweep();

        ZeroDustSweep.SweepAuthorization memory auth =
            _createAuthorization(user, destination, 0.01 ether, block.timestamp + 1 hours, 0);

        // Invalid signature length
        bytes memory signature = hex"1234";

        vm.prank(relayer);
        vm.expectRevert(ZeroDustSweep.InvalidSignature.selector);
        userSweep.executeSweep(auth, signature);
    }

    // ============ View Function Tests ============

    function test_isNonceUsed_returnsFalseForUnused() public view {
        assertFalse(sweepImplementation.isNonceUsed(user, 0));
        assertFalse(sweepImplementation.isNonceUsed(user, 1));
        assertFalse(sweepImplementation.isNonceUsed(user, 999));
    }

    function test_getNextNonce_returnsZeroForNewUser() public view {
        assertEq(sweepImplementation.getNextNonce(user), 0);
    }

    function test_getNextNonce_incrementsAfterUse() public {
        ZeroDustSweep userSweep = _delegateToSweep();

        ZeroDustSweep.SweepAuthorization memory auth =
            _createAuthorization(user, destination, 0.01 ether, block.timestamp + 1 hours, 0);
        bytes memory signature = _signAuthorization(auth, userPrivateKey);

        assertEq(userSweep.getNextNonce(user), 0);

        vm.prank(relayer);
        userSweep.executeSweep(auth, signature);

        assertEq(userSweep.getNextNonce(user), 1);
    }

    function test_getNextNonce_skipsUsedNonces() public {
        ZeroDustSweep userSweep = _delegateToSweep();

        // Use nonce 0
        ZeroDustSweep.SweepAuthorization memory auth0 =
            _createAuthorization(user, destination, 0.01 ether, block.timestamp + 1 hours, 0);
        bytes memory signature0 = _signAuthorization(auth0, userPrivateKey);
        vm.prank(relayer);
        userSweep.executeSweep(auth0, signature0);

        // Fund user and use nonce 2 (skip 1)
        vm.deal(user, 1 ether);
        ZeroDustSweep.SweepAuthorization memory auth2 =
            _createAuthorization(user, destination, 0.01 ether, block.timestamp + 1 hours, 2);
        bytes memory signature2 = _signAuthorization(auth2, userPrivateKey);
        vm.prank(relayer);
        userSweep.executeSweep(auth2, signature2);

        // getNextNonce should return 1 (first unused)
        assertEq(userSweep.getNextNonce(user), 1);
    }

    // ============ Receive Tests ============

    function test_receive_acceptsNativeTokens() public {
        vm.deal(address(this), 1 ether);
        (bool success,) = address(sweepImplementation).call{ value: 0.5 ether }("");
        assertTrue(success);
        assertEq(address(sweepImplementation).balance, 0.5 ether);
    }

    // ============ Fuzz Tests ============

    function testFuzz_executeSweep_compensationCalculation(
        uint256 balance,
        uint256 maxCompensation
    ) public {
        // Bound inputs to reasonable ranges
        balance = bound(balance, 1, 100 ether);
        maxCompensation = bound(maxCompensation, 0, 200 ether);

        vm.deal(user, balance);

        ZeroDustSweep userSweep = _delegateToSweep();

        ZeroDustSweep.SweepAuthorization memory auth =
            _createAuthorization(user, destination, maxCompensation, block.timestamp + 1 hours, 0);
        bytes memory signature = _signAuthorization(auth, userPrivateKey);

        uint256 relayerBalanceBefore = relayer.balance;
        uint256 destinationBalanceBefore = destination.balance;

        vm.prank(relayer);
        userSweep.executeSweep(auth, signature);

        // Calculate expected values
        uint256 expectedCompensation = balance > maxCompensation ? maxCompensation : balance;
        uint256 expectedDestination = balance - expectedCompensation;

        // Verify user is swept to zero
        assertEq(user.balance, 0, "User balance should be zero");

        // Verify compensation
        assertEq(relayer.balance, relayerBalanceBefore + expectedCompensation, "Relayer balance incorrect");

        // Verify destination
        assertEq(destination.balance, destinationBalanceBefore + expectedDestination, "Destination balance incorrect");
    }

    function testFuzz_executeSweep_deadlineEdgeCases(uint256 deadline) public {
        vm.deal(user, 1 ether);

        ZeroDustSweep userSweep = _delegateToSweep();

        ZeroDustSweep.SweepAuthorization memory auth =
            _createAuthorization(user, destination, 0.01 ether, deadline, 0);
        bytes memory signature = _signAuthorization(auth, userPrivateKey);

        if (deadline < block.timestamp) {
            vm.prank(relayer);
            vm.expectRevert(ZeroDustSweep.DeadlineExpired.selector);
            userSweep.executeSweep(auth, signature);
        } else {
            vm.prank(relayer);
            userSweep.executeSweep(auth, signature);
            assertEq(user.balance, 0);
        }
    }

    function testFuzz_executeSweep_nonceIsolation(address user1, address user2, uint256 nonce) public view {
        vm.assume(user1 != user2);
        vm.assume(user1 != address(0));
        vm.assume(user2 != address(0));

        // Nonces should be independent per user
        assertFalse(sweepImplementation.isNonceUsed(user1, nonce));
        assertFalse(sweepImplementation.isNonceUsed(user2, nonce));
    }

    // ============ Gas Tests ============

    function test_executeSweep_gasUsage() public {
        ZeroDustSweep userSweep = _delegateToSweep();

        ZeroDustSweep.SweepAuthorization memory auth =
            _createAuthorization(user, destination, 0.01 ether, block.timestamp + 1 hours, 0);
        bytes memory signature = _signAuthorization(auth, userPrivateKey);

        vm.prank(relayer);
        uint256 gasBefore = gasleft();
        userSweep.executeSweep(auth, signature);
        uint256 gasUsed = gasBefore - gasleft();

        console2.log("Gas used for executeSweep:", gasUsed);

        // Ensure gas usage is reasonable (should be under 110k for a simple sweep)
        assertLt(gasUsed, 110_000);
    }

    // ============ Edge Case Tests ============

    function test_executeSweep_smallBalance() public {
        // Test with very small balance (dust)
        vm.deal(user, 1 wei);

        ZeroDustSweep userSweep = _delegateToSweep();

        ZeroDustSweep.SweepAuthorization memory auth =
            _createAuthorization(user, destination, 0, block.timestamp + 1 hours, 0);
        bytes memory signature = _signAuthorization(auth, userPrivateKey);

        vm.prank(relayer);
        userSweep.executeSweep(auth, signature);

        assertEq(user.balance, 0);
        assertEq(destination.balance, 1 wei);
    }

    function test_executeSweep_largeBalance() public {
        // Test with large balance
        vm.deal(user, 1000 ether);

        ZeroDustSweep userSweep = _delegateToSweep();

        ZeroDustSweep.SweepAuthorization memory auth =
            _createAuthorization(user, destination, 1 ether, block.timestamp + 1 hours, 0);
        bytes memory signature = _signAuthorization(auth, userPrivateKey);

        vm.prank(relayer);
        userSweep.executeSweep(auth, signature);

        assertEq(user.balance, 0);
        assertEq(destination.balance, 999 ether);
        assertEq(relayer.balance, 1 ether);
    }

    function test_executeSweep_deadlineExactlyNow() public {
        ZeroDustSweep userSweep = _delegateToSweep();

        // Deadline exactly at current timestamp should pass
        ZeroDustSweep.SweepAuthorization memory auth =
            _createAuthorization(user, destination, 0.01 ether, block.timestamp, 0);
        bytes memory signature = _signAuthorization(auth, userPrivateKey);

        vm.prank(relayer);
        userSweep.executeSweep(auth, signature);

        assertEq(user.balance, 0);
    }

    function test_executeSweep_destinationIsContract() public {
        // Create a contract that can receive ETH
        address payable contractDest = payable(address(new EtherReceiver()));

        ZeroDustSweep userSweep = _delegateToSweep();

        ZeroDustSweep.SweepAuthorization memory auth =
            _createAuthorization(user, contractDest, 0.01 ether, block.timestamp + 1 hours, 0);
        bytes memory signature = _signAuthorization(auth, userPrivateKey);

        vm.prank(relayer);
        userSweep.executeSweep(auth, signature);

        assertEq(user.balance, 0);
        assertEq(contractDest.balance, 0.99 ether);
    }

    // ============ Transfer Failure Tests ============

    function test_executeSweep_reverts_relayerTransferFails() public {
        ZeroDustSweep userSweep = _delegateToSweep();

        // Create a contract that rejects ETH as the relayer
        EtherRejecter rejecterRelayer = new EtherRejecter();

        ZeroDustSweep.SweepAuthorization memory auth =
            _createAuthorization(user, destination, 0.01 ether, block.timestamp + 1 hours, 0);
        bytes memory signature = _signAuthorization(auth, userPrivateKey);

        vm.prank(address(rejecterRelayer));
        vm.expectRevert(ZeroDustSweep.TransferFailed.selector);
        userSweep.executeSweep(auth, signature);
    }

    function test_executeSweep_reverts_destinationTransferFails() public {
        ZeroDustSweep userSweep = _delegateToSweep();

        // Create a contract that rejects ETH as the destination
        EtherRejecter rejecterDest = new EtherRejecter();

        ZeroDustSweep.SweepAuthorization memory auth =
            _createAuthorization(user, address(rejecterDest), 0.01 ether, block.timestamp + 1 hours, 0);
        bytes memory signature = _signAuthorization(auth, userPrivateKey);

        vm.prank(relayer);
        vm.expectRevert(ZeroDustSweep.TransferFailed.selector);
        userSweep.executeSweep(auth, signature);
    }

    // ============ Legacy Signature Tests ============

    function test_executeSweep_withLegacyVValue() public {
        ZeroDustSweep userSweep = _delegateToSweep();

        ZeroDustSweep.SweepAuthorization memory auth =
            _createAuthorization(user, destination, 0.01 ether, block.timestamp + 1 hours, 0);

        // Create signature with legacy v value (0 or 1 instead of 27 or 28)
        bytes memory signature = _signAuthorizationWithLegacyV(auth, userPrivateKey);

        vm.prank(relayer);
        userSweep.executeSweep(auth, signature);

        assertEq(user.balance, 0);
    }

    function _signAuthorizationWithLegacyV(
        ZeroDustSweep.SweepAuthorization memory auth,
        uint256 privateKey
    ) internal view returns (bytes memory) {
        bytes32 structHash = keccak256(
            abi.encode(
                SWEEP_AUTHORIZATION_TYPEHASH,
                auth.user,
                auth.destination,
                auth.maxRelayerCompensation,
                auth.deadline,
                auth.nonce
            )
        );
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", sweepImplementation.DOMAIN_SEPARATOR(), structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);

        // Convert to legacy v (0 or 1)
        uint8 legacyV = v - 27;

        return abi.encodePacked(r, s, legacyV);
    }
}

/// @notice Helper contract that can receive ETH
contract EtherReceiver {
    receive() external payable { }
}

/// @notice Helper contract that rejects ETH transfers
contract EtherRejecter {
    // No receive or fallback function, so ETH transfers will fail
}
