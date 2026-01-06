// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/**
 * @title ZeroDustSweep
 * @author ZeroDust
 * @notice Enables users to sweep their entire native gas token balance to exactly zero
 * @dev Uses EIP-7702 sponsored execution - user signs authorization, relayer executes
 *
 * This contract is intentionally minimal and immutable:
 * - No admin functions
 * - No pause mechanism
 * - No upgradability
 * - Single purpose: sweep native tokens
 */
contract ZeroDustSweep {
    // ============ Constants ============

    /// @notice EIP-712 domain separator components
    string public constant NAME = "ZeroDust";
    string public constant VERSION = "1";

    /// @notice EIP-712 typehash for SweepAuthorization
    bytes32 public constant SWEEP_AUTHORIZATION_TYPEHASH = keccak256(
        "SweepAuthorization(address user,address destination,uint256 maxRelayerCompensation,uint256 deadline,uint256 nonce)"
    );

    /// @notice EIP-712 domain separator (computed at deployment)
    bytes32 public immutable DOMAIN_SEPARATOR;

    // ============ State ============

    /// @notice Tracks used nonces per user to prevent replay attacks
    /// @dev user => nonce => used
    mapping(address => mapping(uint256 => bool)) public usedNonces;

    // ============ Events ============

    /// @notice Emitted when a sweep is successfully executed
    /// @param user The address whose balance was swept
    /// @param destination The address that received the funds
    /// @param amountSent The amount sent to the destination
    /// @param relayerCompensation The amount paid to the relayer
    /// @param nonce The nonce used for this sweep
    event SweepExecuted(
        address indexed user,
        address indexed destination,
        uint256 amountSent,
        uint256 relayerCompensation,
        uint256 nonce
    );

    // ============ Errors ============

    /// @notice Thrown when signature verification fails
    error InvalidSignature();

    /// @notice Thrown when the authorization deadline has passed
    error DeadlineExpired();

    /// @notice Thrown when the nonce has already been used
    error NonceAlreadyUsed();

    /// @notice Thrown when the user's balance is zero
    error ZeroBalance();

    /// @notice Thrown when relayer compensation exceeds max allowed
    error CompensationExceedsMax();

    /// @notice Thrown when the destination address is zero
    error InvalidDestination();

    /// @notice Thrown when native token transfer fails
    error TransferFailed();

    // ============ Structs ============

    /// @notice Authorization signed by user to allow a sweep
    /// @param user The address to sweep from (signer)
    /// @param destination The address to receive the swept funds
    /// @param maxRelayerCompensation Maximum amount relayer can take as compensation
    /// @param deadline Unix timestamp after which authorization expires
    /// @param nonce Unique identifier to prevent replay (sequential per user)
    struct SweepAuthorization {
        address user;
        address destination;
        uint256 maxRelayerCompensation;
        uint256 deadline;
        uint256 nonce;
    }

    // ============ Constructor ============

    constructor() {
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes(NAME)),
                keccak256(bytes(VERSION)),
                block.chainid,
                address(this)
            )
        );
    }

    // ============ External Functions ============

    /**
     * @notice Execute a sweep to transfer user's entire native balance
     * @dev Called by relayer with user's signed authorization
     *      Uses EIP-7702: user delegates code execution to this contract
     *
     * Flow:
     * 1. Verify signature matches authorization
     * 2. Check deadline hasn't passed
     * 3. Check and mark nonce as used
     * 4. Calculate amounts (compensation + remainder)
     * 5. Transfer compensation to relayer (msg.sender)
     * 6. Transfer remainder to destination
     * 7. Emit event
     *
     * @param auth The sweep authorization signed by the user
     * @param signature The EIP-712 signature over the authorization
     */
    function executeSweep(SweepAuthorization calldata auth, bytes calldata signature) external {
        // ============ Checks ============

        // Verify deadline hasn't passed
        if (block.timestamp > auth.deadline) {
            revert DeadlineExpired();
        }

        // Verify nonce hasn't been used
        if (usedNonces[auth.user][auth.nonce]) {
            revert NonceAlreadyUsed();
        }

        // Verify destination is valid
        if (auth.destination == address(0)) {
            revert InvalidDestination();
        }

        // Verify signature
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
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash));

        address signer = _recoverSigner(digest, signature);
        if (signer != auth.user) {
            revert InvalidSignature();
        }

        // Get user's balance (this is the account that delegated to this contract via EIP-7702)
        uint256 balance = auth.user.balance;
        if (balance == 0) {
            revert ZeroBalance();
        }

        // ============ Effects ============

        // Mark nonce as used before any external calls
        usedNonces[auth.user][auth.nonce] = true;

        // Calculate compensation (capped at balance and maxRelayerCompensation)
        uint256 relayerCompensation = balance > auth.maxRelayerCompensation ? auth.maxRelayerCompensation : balance;
        uint256 amountToDestination = balance - relayerCompensation;

        // ============ Interactions ============

        // Pay relayer (msg.sender)
        if (relayerCompensation > 0) {
            (bool successRelayer,) = payable(msg.sender).call{ value: relayerCompensation }("");
            if (!successRelayer) {
                revert TransferFailed();
            }
        }

        // Send remainder to destination
        if (amountToDestination > 0) {
            (bool successDest,) = payable(auth.destination).call{ value: amountToDestination }("");
            if (!successDest) {
                revert TransferFailed();
            }
        }

        emit SweepExecuted(auth.user, auth.destination, amountToDestination, relayerCompensation, auth.nonce);
    }

    /**
     * @notice Check if a nonce has been used for a given user
     * @param user The user address
     * @param nonce The nonce to check
     * @return True if the nonce has been used
     */
    function isNonceUsed(address user, uint256 nonce) external view returns (bool) {
        return usedNonces[user][nonce];
    }

    /**
     * @notice Get the next available nonce for a user
     * @dev Scans from 0 until an unused nonce is found
     *      For gas efficiency, frontend should track last nonce
     * @param user The user address
     * @return The next unused nonce
     */
    function getNextNonce(address user) external view returns (uint256) {
        uint256 nonce = 0;
        while (usedNonces[user][nonce]) {
            unchecked {
                ++nonce;
            }
        }
        return nonce;
    }

    // ============ Internal Functions ============

    /**
     * @notice Recover signer address from signature
     * @dev Supports both 65-byte signatures and EIP-2098 compact signatures
     * @param digest The message digest that was signed
     * @param signature The signature bytes
     * @return The recovered signer address
     */
    function _recoverSigner(bytes32 digest, bytes calldata signature) internal pure returns (address) {
        if (signature.length == 65) {
            bytes32 r;
            bytes32 s;
            uint8 v;

            assembly {
                r := calldataload(signature.offset)
                s := calldataload(add(signature.offset, 32))
                v := byte(0, calldataload(add(signature.offset, 64)))
            }

            // Handle legacy v values
            if (v < 27) {
                v += 27;
            }

            return ecrecover(digest, v, r, s);
        } else if (signature.length == 64) {
            // EIP-2098 compact signature
            bytes32 r;
            bytes32 vs;

            assembly {
                r := calldataload(signature.offset)
                vs := calldataload(add(signature.offset, 32))
            }

            uint8 v = uint8((uint256(vs) >> 255) + 27);
            bytes32 s = vs & bytes32(0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff);

            return ecrecover(digest, v, r, s);
        } else {
            revert InvalidSignature();
        }
    }

    // ============ Receive ============

    /// @notice Allow contract to receive native tokens (required for EIP-7702 delegation)
    receive() external payable { }
}
