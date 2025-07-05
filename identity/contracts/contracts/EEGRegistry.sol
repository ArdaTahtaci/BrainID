// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title EEGRegistry
 * @dev Registry contract for EEG-based identity commitments
 * Manages user registration and identity verification for the EEG Semaphore system
 */
contract EEGRegistry {
    // Events
    event UserRegistered(
        address indexed user,
        uint256 indexed identityCommitment,
        uint256 timestamp
    );
    
    event IdentityVerified(
        address indexed user,
        uint256 indexed identityCommitment,
        bool verified
    );

    // State variables
    mapping(address => uint256) public userToCommitment;
    mapping(uint256 => address) public commitmentToUser;
    mapping(uint256 => bool) public verifiedIdentities;
    mapping(address => bool) public registeredUsers;
    
    uint256 public totalRegisteredUsers;
    
    // Modifiers
    modifier onlyRegistered() {
        require(registeredUsers[msg.sender], "User not registered");
        _;
    }
    
    modifier notRegistered() {
        require(!registeredUsers[msg.sender], "User already registered");
        _;
    }
    
    modifier validCommitment(uint256 _commitment) {
        require(_commitment != 0, "Invalid commitment");
        require(commitmentToUser[_commitment] == address(0), "Commitment already used");
        _;
    }

    /**
     * @dev Register a new user with their EEG-based identity commitment
     * @param _identityCommitment The Poseidon hash of the user's EEG features
     */
    function registerUser(uint256 _identityCommitment) 
        external 
        notRegistered 
        validCommitment(_identityCommitment)
    {
        // Store the mapping between user address and identity commitment
        userToCommitment[msg.sender] = _identityCommitment;
        commitmentToUser[_identityCommitment] = msg.sender;
        registeredUsers[msg.sender] = true;
        
        // Increment total registered users
        totalRegisteredUsers++;
        
        // Emit registration event
        emit UserRegistered(msg.sender, _identityCommitment, block.timestamp);
    }
    
    /**
     * @dev Verify a user's identity (for demo purposes - in production this would be more complex)
     * @param _user The user address to verify
     */
    function verifyIdentity(address _user) external {
        require(registeredUsers[_user], "User not registered");
        uint256 commitment = userToCommitment[_user];
        
        // Mark identity as verified
        verifiedIdentities[commitment] = true;
        
        emit IdentityVerified(_user, commitment, true);
    }
    
    /**
     * @dev Get user's identity commitment
     * @param _user The user address
     * @return The identity commitment
     */
    function getUserCommitment(address _user) external view returns (uint256) {
        require(registeredUsers[_user], "User not registered");
        return userToCommitment[_user];
    }
    
    /**
     * @dev Get user address from identity commitment
     * @param _commitment The identity commitment
     * @return The user address
     */
    function getCommitmentUser(uint256 _commitment) external view returns (address) {
        return commitmentToUser[_commitment];
    }
    
    /**
     * @dev Check if an identity is verified
     * @param _commitment The identity commitment
     * @return True if verified, false otherwise
     */
    function isIdentityVerified(uint256 _commitment) external view returns (bool) {
        return verifiedIdentities[_commitment];
    }
    
    /**
     * @dev Check if a user is registered
     * @param _user The user address
     * @return True if registered, false otherwise
     */
    function isUserRegistered(address _user) external view returns (bool) {
        return registeredUsers[_user];
    }
} 