export const EEGVerifierABI = [
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_semaphoreVerifier",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "_eegRegistry",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "groupId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "creator",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "description",
                "type": "string"
            }
        ],
        "name": "GroupCreated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "nullifierHash",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "groupId",
                "type": "uint256"
            }
        ],
        "name": "NullifierUsed",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "groupId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "merkleTreeRoot",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "nullifierHash",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "signal",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "verifier",
                "type": "address"
            }
        ],
        "name": "ProofVerified",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_description",
                "type": "string"
            }
        ],
        "name": "createGroup",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "groupId",
                "type": "uint256"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_groupId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_identityCommitment",
                "type": "uint256"
            }
        ],
        "name": "addGroupMember",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_groupId",
                "type": "uint256"
            }
        ],
        "name": "getGroupInfo",
        "outputs": [
            {
                "internalType": "address",
                "name": "admin",
                "type": "address"
            },
            {
                "internalType": "string",
                "name": "description",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "memberCount",
                "type": "uint256"
            },
            {
                "internalType": "bool",
                "name": "active",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_merkleTreeRoot",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_nullifierHash",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_signal",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_groupId",
                "type": "uint256"
            },
            {
                "internalType": "uint256[8]",
                "name": "_proof",
                "type": "uint256[8]"
            }
        ],
        "name": "verifyProof",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_nullifierHash",
                "type": "uint256"
            }
        ],
        "name": "isNullifierUsed",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
] as const; 