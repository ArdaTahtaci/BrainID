// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./SemaphoreVerifier.sol";
import "./EEGRegistry.sol";

/**
 * @title EEGVerifier
 * @dev Main verification contract using Semaphore proofs for EEG-based identity
 * Handles proof verification, nullifier checking, and group management
 */
contract EEGVerifier {
    // Semaphore verifier contract
    SemaphoreVerifier public immutable semaphoreVerifier;
    
    // EEG Registry contract
    EEGRegistry public immutable eegRegistry;
    
    // Events
    event ProofVerified(
        uint256 indexed groupId,
        uint256 merkleTreeRoot,
        uint256 nullifierHash,
        uint256 signal,
        address indexed verifier
    );
    
    event NullifierUsed(
        uint256 indexed nullifierHash,
        uint256 indexed groupId
    );
    
    event GroupCreated(
        uint256 indexed groupId,
        address indexed creator,
        string description
    );
    
    // State variables
    mapping(uint256 => bool) public usedNullifiers;
    mapping(uint256 => Group) public groups;
    mapping(uint256 => mapping(uint256 => bool)) public groupMembers;
    uint256 public nextGroupId;
    
    struct Group {
        address admin;
        string description;
        uint256 memberCount;
        bool active;
    }
    
    // Modifiers
    modifier onlyGroupAdmin(uint256 _groupId) {
        require(groups[_groupId].admin == msg.sender, "Not group admin");
        _;
    }
    
    modifier validGroup(uint256 _groupId) {
        require(groups[_groupId].active, "Group not active");
        _;
    }
    
    modifier nullifierNotUsed(uint256 _nullifierHash) {
        require(!usedNullifiers[_nullifierHash], "Nullifier already used");
        _;
    }
    
    /**
     * @dev Constructor
     * @param _semaphoreVerifier Address of the Semaphore verifier contract
     * @param _eegRegistry Address of the EEG registry contract
     */
    constructor(
        address _semaphoreVerifier,
        address _eegRegistry
    ) {
        semaphoreVerifier = SemaphoreVerifier(_semaphoreVerifier);
        eegRegistry = EEGRegistry(_eegRegistry);
        nextGroupId = 1;
    }
    
    /**
     * @dev Create a new verification group
     * @param _description Description of the group
     * @return groupId The ID of the created group
     */
    function createGroup(string memory _description) external returns (uint256 groupId) {
        groupId = nextGroupId++;
        
        groups[groupId] = Group({
            admin: msg.sender,
            description: _description,
            memberCount: 0,
            active: true
        });
        
        emit GroupCreated(groupId, msg.sender, _description);
    }
    
    /**
     * @dev Add a member to a group
     * @param _groupId The group ID
     * @param _identityCommitment The member's identity commitment
     */
    function addGroupMember(
        uint256 _groupId,
        uint256 _identityCommitment
    ) external onlyGroupAdmin(_groupId) validGroup(_groupId) {
        require(!groupMembers[_groupId][_identityCommitment], "Member already in group");
        require(eegRegistry.isIdentityVerified(_identityCommitment), "Identity not verified");
        
        groupMembers[_groupId][_identityCommitment] = true;
        groups[_groupId].memberCount++;
    }
    
    /**
     * @dev Remove a member from a group
     * @param _groupId The group ID
     * @param _identityCommitment The member's identity commitment
     */
    function removeGroupMember(
        uint256 _groupId,
        uint256 _identityCommitment
    ) external onlyGroupAdmin(_groupId) validGroup(_groupId) {
        require(groupMembers[_groupId][_identityCommitment], "Member not in group");
        
        groupMembers[_groupId][_identityCommitment] = false;
        groups[_groupId].memberCount--;
    }
    
    /**
     * @dev Verify a Semaphore proof
     * @param _groupId The group ID
     * @param _merkleTreeRoot The Merkle tree root
     * @param _signal The signal being proved
     * @param _nullifierHash The nullifier hash
     * @param _merkleTreeDepth The depth of the merkle tree
     * @param _pA Point A of the proof
     * @param _pB Point B of the proof
     * @param _pC Point C of the proof
     */
    function verifyProof(
        uint256 _groupId,
        uint256 _merkleTreeRoot,
        uint256 _signal,
        uint256 _nullifierHash,
        uint256 _merkleTreeDepth,
        uint[2] calldata _pA,
        uint[2][2] calldata _pB,
        uint[2] calldata _pC
    ) external validGroup(_groupId) nullifierNotUsed(_nullifierHash) {
        // Prepare public signals: [merkleTreeRoot, nullifierHash, signal, externalNullifier]
        uint[4] memory pubSignals = [
            _merkleTreeRoot,
            _nullifierHash, 
            _signal,
            _groupId // Using groupId as the external nullifier
        ];
        
        // Verify the Semaphore proof
        require(
            semaphoreVerifier.verifyProof(_pA, _pB, _pC, pubSignals, _merkleTreeDepth),
            "Invalid proof"
        );
        
        // Mark nullifier as used
        usedNullifiers[_nullifierHash] = true;
        
        // Emit events
        emit NullifierUsed(_nullifierHash, _groupId);
        emit ProofVerified(_groupId, _merkleTreeRoot, _nullifierHash, _signal, msg.sender);
    }
    
    /**
     * @dev Check if a member is in a group
     * @param _groupId The group ID
     * @param _identityCommitment The member's identity commitment
     * @return True if member is in group, false otherwise
     */
    function isGroupMember(
        uint256 _groupId,
        uint256 _identityCommitment
    ) external view returns (bool) {
        return groupMembers[_groupId][_identityCommitment];
    }
    
    /**
     * @dev Get group information
     * @param _groupId The group ID
     * @return admin The group admin address
     * @return description The group description
     * @return memberCount The number of members
     * @return active Whether the group is active
     */
    function getGroupInfo(uint256 _groupId) external view returns (
        address admin,
        string memory description,
        uint256 memberCount,
        bool active
    ) {
        Group memory group = groups[_groupId];
        return (group.admin, group.description, group.memberCount, group.active);
    }
    
    /**
     * @dev Deactivate a group
     * @param _groupId The group ID
     */
    function deactivateGroup(uint256 _groupId) external onlyGroupAdmin(_groupId) {
        groups[_groupId].active = false;
    }
    
    /**
     * @dev Check if a nullifier has been used
     * @param _nullifierHash The nullifier hash
     * @return True if used, false otherwise
     */
    function isNullifierUsed(uint256 _nullifierHash) external view returns (bool) {
        return usedNullifiers[_nullifierHash];
    }
} 