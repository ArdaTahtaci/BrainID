// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.20;

import "./Verifier.sol";

contract EEGWorldVerifier is Verifier {
    uint256 public constant GROUP_ID = 42;
    address public immutable owner;

    mapping(uint256 => bool) public isRoot; // geçerli Merkle kökleri
    event RootUpdated(uint256 indexed newRoot);

    constructor(uint256 initialRoot) {
        owner = msg.sender;
        isRoot[initialRoot] = true;
        emit RootUpdated(initialRoot);
    }

    function setRoot(uint256 newRoot) external {
        require(msg.sender == owner, "not authorized");
        isRoot[newRoot] = true;
        emit RootUpdated(newRoot);
    }

    function verifyEEGProof(
        uint[2] calldata pA,
        uint[2][2] calldata pB,
        uint[2] calldata pC,
        uint[2] calldata pubSignals // [signalHash, nullifierHash] - devrenize göre
    ) external view returns (bool) {
        // uint256 signalHash = pubSignals[0];
        // uint256 nullifier = pubSignals[1];

        // require(isRoot[pubSignals[2]], "invalid root");

        require(verifyProof(pA, pB, pC, pubSignals), "bad proof");
        return true;
    }
}
