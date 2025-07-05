# EEG Merkle Backend API Documentation

## Overview
The EEG Merkle Backend provides APIs for EEG-based identity verification using Semaphore zero-knowledge proofs. This system allows users to create cryptographic identities from their EEG brainwave patterns and generate proofs without revealing their biometric data.

## Base URL
```
http://localhost:8000
```

## API Endpoints

### Health Check
- **GET** `/`
- **Response**: `{ "response": "API works" }`

---

## Merkle Tree APIs

### 1. Generate Merkle Tree
- **POST** `/api/merkle/generate`
- **Description**: Generate a Merkle tree from EEG features
- **Body**:
```json
{
  "features": [1.23, 4.56, 7.89, 2.34, 5.67]
}
```
- **Response**:
```json
{
  "success": true,
  "root": "0x1234...",
  "tree": { /* IMT tree structure */ },
  "message": "Merkle tree generated successfully"
}
```

### 2. Add Feature to Tree
- **POST** `/api/merkle/add`
- **Description**: Add a new EEG feature to existing tree
- **Body**:
```json
{
  "tree": { /* existing tree */ },
  "feature": 9.87
}
```

### 3. Generate Merkle Proof
- **POST** `/api/merkle/proof`
- **Description**: Generate inclusion proof for a feature
- **Body**:
```json
{
  "tree": { /* tree structure */ },
  "feature": 1.23
}
```

---

## Semaphore Proof APIs

### 1. Create Identity from EEG
- **POST** `/api/proof/identity/create`
- **Description**: Generate Semaphore identity commitment from EEG features
- **Body**:
```json
{
  "eegFeatures": [1.23, 4.56, 7.89, 2.34, 5.67, 8.91, 3.45, 6.78]
}
```
- **Response**:
```json
{
  "success": true,
  "identityCommitment": "12345678901234567890123456789012345678901234567890123456789012345678",
  "message": "Identity commitment generated successfully"
}
```

### 2. Create Group
- **POST** `/api/proof/group/create`
- **Description**: Create a new Semaphore group
- **Body**:
```json
{
  "groupId": "humanity_verification_group",
  "memberEEGFeatures": [
    [1.23, 4.56, 7.89, 2.34, 5.67, 8.91, 3.45, 6.78],
    [2.34, 5.67, 8.91, 3.45, 6.78, 1.23, 4.56, 7.89]
  ]
}
```
- **Response**:
```json
{
  "success": true,
  "groupId": "humanity_verification_group",
  "memberCount": 2,
  "root": "1234567890123456789012345678901234567890123456789012345678901234567890",
  "message": "Group created successfully"
}
```

### 3. Add Member to Group
- **POST** `/api/proof/group/:groupId/member/add`
- **Description**: Add a new member to an existing group
- **Body**:
```json
{
  "eegFeatures": [3.45, 6.78, 1.23, 4.56, 7.89, 2.34, 5.67, 8.91]
}
```
- **Response**:
```json
{
  "success": true,
  "groupId": "humanity_verification_group",
  "identityCommitment": "98765432109876543210987654321098765432109876543210987654321098765432",
  "memberCount": 3,
  "root": "2345678901234567890123456789012345678901234567890123456789012345678901",
  "message": "Member added successfully"
}
```

### 4. Generate Humanity Proof
- **POST** `/api/proof/humanity`
- **Description**: Generate a proof that the user is human based on EEG patterns
- **Body**:
```json
{
  "eegFeatures": [1.23, 4.56, 7.89, 2.34, 5.67, 8.91, 3.45, 6.78],
  "groupId": "humanity_verification_group",
  "message": "I am human" // optional
}
```
- **Response**:
```json
{
  "success": true,
  "proof": ["0x1234...", "0x5678...", "0x9abc...", "0xdef0...", "0x2345...", "0x6789...", "0xabcd...", "0xef01..."],
  "merkleTreeRoot": "1234567890123456789012345678901234567890123456789012345678901234567890",
  "nullifierHash": "9876543210987654321098765432109876543210987654321098765432109876543210",
  "signal": "123456789",
  "externalNullifier": "987654321",
  "message": "Humanity proof generated successfully"
}
```

### 5. Generate Vote Proof
- **POST** `/api/proof/vote`
- **Description**: Generate a proof for anonymous voting
- **Body**:
```json
{
  "eegFeatures": [1.23, 4.56, 7.89, 2.34, 5.67, 8.91, 3.45, 6.78],
  "groupId": "voting_group",
  "vote": "option_A",
  "pollId": "poll_2024_001"
}
```
- **Response**:
```json
{
  "success": true,
  "proof": ["0x1234...", "0x5678...", "0x9abc...", "0xdef0...", "0x2345...", "0x6789...", "0xabcd...", "0xef01..."],
  "merkleTreeRoot": "1234567890123456789012345678901234567890123456789012345678901234567890",
  "nullifierHash": "9876543210987654321098765432109876543210987654321098765432109876543210",
  "signal": "123456789",
  "externalNullifier": "987654321",
  "vote": "option_A",
  "pollId": "poll_2024_001",
  "message": "Vote proof generated successfully"
}
```

### 6. Verify Proof
- **POST** `/api/proof/verify`
- **Description**: Verify a Semaphore proof
- **Body**:
```json
{
  "proof": ["0x1234...", "0x5678...", "0x9abc...", "0xdef0...", "0x2345...", "0x6789...", "0xabcd...", "0xef01..."],
  "merkleTreeRoot": "1234567890123456789012345678901234567890123456789012345678901234567890",
  "signal": "123456789",
  "externalNullifier": "987654321",
  "nullifierHash": "9876543210987654321098765432109876543210987654321098765432109876543210"
}
```
- **Response**:
```json
{
  "success": true,
  "valid": true,
  "message": "Proof is valid"
}
```

### 7. Get Group Information
- **GET** `/api/proof/group/:groupId`
- **Description**: Get information about a specific group
- **Response**:
```json
{
  "success": true,
  "groupId": "humanity_verification_group",
  "memberCount": 3,
  "root": "2345678901234567890123456789012345678901234567890123456789012345678901",
  "depth": 20,
  "message": "Group information retrieved successfully"
}
```

### 8. List All Groups
- **GET** `/api/proof/groups`
- **Description**: Get list of all groups
- **Response**:
```json
{
  "success": true,
  "groups": [
    {
      "groupId": "humanity_verification_group",
      "memberCount": 3,
      "root": "2345678901234567890123456789012345678901234567890123456789012345678901",
      "depth": 20
    },
    {
      "groupId": "voting_group",
      "memberCount": 5,
      "root": "3456789012345678901234567890123456789012345678901234567890123456789012",
      "depth": 20
    }
  ],
  "totalGroups": 2,
  "message": "Groups retrieved successfully"
}
```

---

## Integration Flow

### 1. User Registration Flow
```
1. Capture EEG data from user
2. Extract features from EEG signals
3. POST /api/proof/identity/create → Get identity commitment
4. Create or join a verification group
5. Store identity commitment on-chain via smart contract
```

### 2. Humanity Verification Flow
```
1. User provides EEG features
2. POST /api/proof/humanity → Generate proof
3. Submit proof to smart contract for verification
4. Contract verifies proof and updates user status
```

### 3. Anonymous Voting Flow
```
1. Create voting group with registered users
2. User generates vote proof with their EEG features
3. POST /api/proof/vote → Generate anonymous vote proof
4. Submit proof to voting contract
5. Vote is counted without revealing voter identity
```

---

## Error Responses

All endpoints return errors in the following format:
```json
{
  "success": false,
  "error": "Error message description",
  "message": "User-friendly error message"
}
```

Common HTTP status codes:
- `400` - Bad Request (invalid input)
- `404` - Not Found (group not found)
- `500` - Internal Server Error (proof generation failed)

---

## Testing Examples

### Using curl

#### Create Identity
```bash
curl -X POST http://localhost:8000/api/proof/identity/create \
  -H "Content-Type: application/json" \
  -d '{
    "eegFeatures": [1.23, 4.56, 7.89, 2.34, 5.67, 8.91, 3.45, 6.78]
  }'
```

#### Create Group
```bash
curl -X POST http://localhost:8000/api/proof/group/create \
  -H "Content-Type: application/json" \
  -d '{
    "groupId": "test_group",
    "memberEEGFeatures": [
      [1.23, 4.56, 7.89, 2.34, 5.67, 8.91, 3.45, 6.78]
    ]
  }'
```

#### Generate Humanity Proof
```bash
curl -X POST http://localhost:8000/api/proof/humanity \
  -H "Content-Type: application/json" \
  -d '{
    "eegFeatures": [1.23, 4.56, 7.89, 2.34, 5.67, 8.91, 3.45, 6.78],
    "groupId": "test_group"
  }'
```

---

## Notes

1. **EEG Features**: Should be normalized numerical values extracted from brainwave signals
2. **Group Management**: Groups are stored in memory and will be lost on server restart (use database in production)
3. **Identity Determinism**: Same EEG features will always generate the same identity commitment
4. **Proof Security**: Proofs are zero-knowledge - they don't reveal the original EEG data
5. **Nullifier Uniqueness**: Each proof generates a unique nullifier to prevent double-spending

---

## Dependencies

- `@semaphore-protocol/identity` - Identity management
- `@semaphore-protocol/group` - Group operations
- `@semaphore-protocol/proof` - Proof generation and verification
- `circomlibjs` - Poseidon hashing
- `@zk-kit/imt` - Incremental Merkle Trees 

🚀 EEG Merkle Backend listening on http://localhost:8000
📚 Available endpoints:
   GET  /                           - Health check
   POST /api/merkle/generate        - Generate Merkle tree
   POST /api/proof-simple/identity/create - Create identity
   POST /api/proof-simple/group/create    - Create group
   POST /api/proof-simple/proof/generate  - Generate proof
   POST /api/proof-simple/proof/verify    - Verify proof 