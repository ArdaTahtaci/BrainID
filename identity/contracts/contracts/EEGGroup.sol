// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./EEGRegistry.sol";

/**
 * @title EEGGroup
 * @dev Advanced group management for verified EEG users
 * Handles group creation, member management, and group verification
 */
contract EEGGroup {
    // EEG Registry contract
    EEGRegistry public immutable eegRegistry;
    
    // Events
    event GroupCreated(
        uint256 indexed groupId,
        address indexed creator,
        string name
    );
    
    event MemberAdded(
        uint256 indexed groupId,
        uint256 indexed identityCommitment
    );
    
    event MemberRemoved(
        uint256 indexed groupId,
        uint256 indexed identityCommitment
    );
    
    event GroupUpdated(
        uint256 indexed groupId,
        string name,
        string description
    );
    
    event AdminAdded(
        uint256 indexed groupId,
        address indexed newAdmin,
        address indexed addedBy
    );
    
    event AdminRemoved(
        uint256 indexed groupId,
        address indexed removedAdmin,
        address indexed removedBy
    );
    
    // Enums
    enum GroupType {
        Public,     // Anyone can join
        Private,    // Admin approval required
        Exclusive   // Invitation only
    }
    
    // Structs
    struct Group {
        string name;
        string description;
        address creator;
        GroupType groupType;
        uint256 memberCount;
        uint256 maxMembers;
        bool active;
        uint256 createdAt;
    }
    
    // State variables
    mapping(uint256 => Group) public groups;
    mapping(uint256 => mapping(address => bool)) public groupAdmins;
    mapping(uint256 => mapping(uint256 => bool)) public groupMembers;
    mapping(uint256 => uint256[]) public groupMembersList;
    mapping(address => uint256[]) public userGroups;
    
    uint256 public nextGroupId;
    uint256 public totalGroups;
    
    // Modifiers
    modifier onlyGroupAdmin(uint256 _groupId) {
        require(
            groupAdmins[_groupId][msg.sender] || groups[_groupId].creator == msg.sender,
            "Not group admin"
        );
        _;
    }
    
    modifier validGroup(uint256 _groupId) {
        require(_groupId < nextGroupId && groups[_groupId].active, "Invalid group");
        _;
    }
    
    modifier onlyVerifiedUser() {
        require(eegRegistry.isUserRegistered(msg.sender), "User not registered");
        uint256 commitment = eegRegistry.getUserCommitment(msg.sender);
        require(eegRegistry.isIdentityVerified(commitment), "Identity not verified");
        _;
    }
    
    /**
     * @dev Constructor
     * @param _eegRegistry Address of the EEG registry contract
     */
    constructor(address _eegRegistry) {
        eegRegistry = EEGRegistry(_eegRegistry);
        nextGroupId = 1;
    }
    
    /**
     * @dev Create a new group
     * @param _name Group name
     * @param _description Group description
     * @param _groupType Type of group (Public, Private, Exclusive)
     * @param _maxMembers Maximum number of members (0 for unlimited)
     * @return groupId The ID of the created group
     */
    function createGroup(
        string memory _name,
        string memory _description,
        GroupType _groupType,
        uint256 _maxMembers
    ) external onlyVerifiedUser returns (uint256 groupId) {
        require(bytes(_name).length > 0, "Group name cannot be empty");
        
        groupId = nextGroupId++;
        
        groups[groupId] = Group({
            name: _name,
            description: _description,
            creator: msg.sender,
            groupType: _groupType,
            memberCount: 0,
            maxMembers: _maxMembers,
            active: true,
            createdAt: block.timestamp
        });
        
        // Creator is automatically an admin
        groupAdmins[groupId][msg.sender] = true;
        
        totalGroups++;
        
        emit GroupCreated(groupId, msg.sender, _name);
    }
    
    /**
     * @dev Add a member to a group
     * @param _groupId The group ID
     * @param _identityCommitment The member's identity commitment
     */
    function addMember(
        uint256 _groupId,
        uint256 _identityCommitment
    ) external onlyGroupAdmin(_groupId) validGroup(_groupId) {
        require(!groupMembers[_groupId][_identityCommitment], "Already a member");
        require(eegRegistry.isIdentityVerified(_identityCommitment), "Identity not verified");
        
        Group storage group = groups[_groupId];
        require(
            group.maxMembers == 0 || group.memberCount < group.maxMembers,
            "Group is full"
        );
        
        groupMembers[_groupId][_identityCommitment] = true;
        groupMembersList[_groupId].push(_identityCommitment);
        group.memberCount++;
        
        // Add group to user's list
        address userAddress = eegRegistry.getCommitmentUser(_identityCommitment);
        if (userAddress != address(0)) {
            userGroups[userAddress].push(_groupId);
        }
        
        emit MemberAdded(_groupId, _identityCommitment);
    }
    
    /**
     * @dev Remove a member from a group
     * @param _groupId The group ID
     * @param _identityCommitment The member's identity commitment
     */
    function removeMember(
        uint256 _groupId,
        uint256 _identityCommitment
    ) external onlyGroupAdmin(_groupId) validGroup(_groupId) {
        require(groupMembers[_groupId][_identityCommitment], "Not a member");
        
        groupMembers[_groupId][_identityCommitment] = false;
        groups[_groupId].memberCount--;
        
        // Remove from members list
        uint256[] storage membersList = groupMembersList[_groupId];
        for (uint256 i = 0; i < membersList.length; i++) {
            if (membersList[i] == _identityCommitment) {
                membersList[i] = membersList[membersList.length - 1];
                membersList.pop();
                break;
            }
        }
        
        emit MemberRemoved(_groupId, _identityCommitment);
    }
    
    /**
     * @dev Join a public group
     * @param _groupId The group ID
     */
    function joinGroup(uint256 _groupId) external onlyVerifiedUser validGroup(_groupId) {
        require(groups[_groupId].groupType == GroupType.Public, "Group is not public");
        
        uint256 commitment = eegRegistry.getUserCommitment(msg.sender);
        require(!groupMembers[_groupId][commitment], "Already a member");
        
        Group storage group = groups[_groupId];
        require(
            group.maxMembers == 0 || group.memberCount < group.maxMembers,
            "Group is full"
        );
        
        groupMembers[_groupId][commitment] = true;
        groupMembersList[_groupId].push(commitment);
        group.memberCount++;
        userGroups[msg.sender].push(_groupId);
        
        emit MemberAdded(_groupId, commitment);
    }
    
    /**
     * @dev Leave a group
     * @param _groupId The group ID
     */
    function leaveGroup(uint256 _groupId) external validGroup(_groupId) {
        uint256 commitment = eegRegistry.getUserCommitment(msg.sender);
        require(groupMembers[_groupId][commitment], "Not a member");
        
        groupMembers[_groupId][commitment] = false;
        groups[_groupId].memberCount--;
        
        // Remove from members list
        uint256[] storage membersList = groupMembersList[_groupId];
        for (uint256 i = 0; i < membersList.length; i++) {
            if (membersList[i] == commitment) {
                membersList[i] = membersList[membersList.length - 1];
                membersList.pop();
                break;
            }
        }
        
        emit MemberRemoved(_groupId, commitment);
    }
    
    /**
     * @dev Add an admin to a group
     * @param _groupId The group ID
     * @param _newAdmin The new admin address
     */
    function addAdmin(
        uint256 _groupId,
        address _newAdmin
    ) external onlyGroupAdmin(_groupId) validGroup(_groupId) {
        require(!groupAdmins[_groupId][_newAdmin], "Already an admin");
        require(eegRegistry.isUserRegistered(_newAdmin), "User not registered");
        
        groupAdmins[_groupId][_newAdmin] = true;
        emit AdminAdded(_groupId, _newAdmin, msg.sender);
    }
    
    /**
     * @dev Remove an admin from a group
     * @param _groupId The group ID
     * @param _admin The admin address to remove
     */
    function removeAdmin(
        uint256 _groupId,
        address _admin
    ) external validGroup(_groupId) {
        require(groups[_groupId].creator == msg.sender, "Only creator can remove admins");
        require(groupAdmins[_groupId][_admin], "Not an admin");
        require(_admin != msg.sender, "Cannot remove yourself");
        
        groupAdmins[_groupId][_admin] = false;
        emit AdminRemoved(_groupId, _admin, msg.sender);
    }
    
    /**
     * @dev Update group information
     * @param _groupId The group ID
     * @param _name New group name
     * @param _description New group description
     */
    function updateGroup(
        uint256 _groupId,
        string memory _name,
        string memory _description
    ) external onlyGroupAdmin(_groupId) validGroup(_groupId) {
        require(bytes(_name).length > 0, "Group name cannot be empty");
        
        groups[_groupId].name = _name;
        groups[_groupId].description = _description;
        
        emit GroupUpdated(_groupId, _name, _description);
    }
    
    /**
     * @dev Deactivate a group
     * @param _groupId The group ID
     */
    function deactivateGroup(uint256 _groupId) external validGroup(_groupId) {
        require(groups[_groupId].creator == msg.sender, "Only creator can deactivate");
        groups[_groupId].active = false;
    }
    
    /**
     * @dev Check if a user is a member of a group
     * @param _groupId The group ID
     * @param _identityCommitment The identity commitment
     * @return True if member, false otherwise
     */
    function isMember(uint256 _groupId, uint256 _identityCommitment) external view returns (bool) {
        return groupMembers[_groupId][_identityCommitment];
    }
    
    /**
     * @dev Check if a user is an admin of a group
     * @param _groupId The group ID
     * @param _user The user address
     * @return True if admin, false otherwise
     */
    function isAdmin(uint256 _groupId, address _user) external view returns (bool) {
        return groupAdmins[_groupId][_user] || groups[_groupId].creator == _user;
    }
    
    /**
     * @dev Get group members
     * @param _groupId The group ID
     * @return Array of identity commitments
     */
    function getGroupMembers(uint256 _groupId) external view returns (uint256[] memory) {
        return groupMembersList[_groupId];
    }
    
    /**
     * @dev Get user's groups
     * @param _user The user address
     * @return Array of group IDs
     */
    function getUserGroups(address _user) external view returns (uint256[] memory) {
        return userGroups[_user];
    }
    
    /**
     * @dev Get group information
     * @param _groupId The group ID
     * @return Group struct
     */
    function getGroup(uint256 _groupId) external view returns (Group memory) {
        return groups[_groupId];
    }
} 