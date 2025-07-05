import { useContractRead, useContractWrite, usePrepareContractWrite, useWaitForTransaction } from 'wagmi';
import { CONTRACT_ADDRESSES } from '../contracts/addresses';
import { EEGRegistryABI } from '../contracts/abis/EEGRegistry';
import { EEGVerifierABI } from '../contracts/abis/EEGVerifier';

// EEG Registry Hooks
export function useRegisterUser(identityCommitment?: bigint) {
    const { config, error: prepareError } = usePrepareContractWrite({
        address: CONTRACT_ADDRESSES.EEGRegistry,
        abi: EEGRegistryABI,
        functionName: 'registerUser',
        args: identityCommitment ? [identityCommitment] : undefined,
        enabled: !!identityCommitment,
    });

    const { data, error, isLoading, write } = useContractWrite(config);

    const { isLoading: isTransactionLoading, isSuccess } = useWaitForTransaction({
        hash: data?.hash,
    });

    return {
        registerUser: write,
        data,
        error: error || prepareError,
        isLoading: isLoading || isTransactionLoading,
        isSuccess,
        transactionHash: data?.hash,
    };
}

export function useIsUserRegistered(userAddress?: string) {
    return useContractRead({
        address: CONTRACT_ADDRESSES.EEGRegistry,
        abi: EEGRegistryABI,
        functionName: 'isUserRegistered',
        args: userAddress ? [userAddress as `0x${string}`] : undefined,
        enabled: !!userAddress,
    });
}

export function useGetUserCommitment(userAddress?: string) {
    return useContractRead({
        address: CONTRACT_ADDRESSES.EEGRegistry,
        abi: EEGRegistryABI,
        functionName: 'getUserCommitment',
        args: userAddress ? [userAddress as `0x${string}`] : undefined,
        enabled: !!userAddress,
    });
}

export function useTotalRegisteredUsers() {
    return useContractRead({
        address: CONTRACT_ADDRESSES.EEGRegistry,
        abi: EEGRegistryABI,
        functionName: 'totalRegisteredUsers',
    });
}

// EEG Verifier Hooks
export function useCreateGroup(description?: string) {
    const { config, error: prepareError } = usePrepareContractWrite({
        address: CONTRACT_ADDRESSES.EEGVerifier,
        abi: EEGVerifierABI,
        functionName: 'createGroup',
        args: description ? [description] : undefined,
        enabled: !!description,
    });

    const { data, error, isLoading, write } = useContractWrite(config);

    const { isLoading: isTransactionLoading, isSuccess } = useWaitForTransaction({
        hash: data?.hash,
    });

    return {
        createGroup: write,
        data,
        error: error || prepareError,
        isLoading: isLoading || isTransactionLoading,
        isSuccess,
        transactionHash: data?.hash,
    };
}

export function useAddGroupMember(groupId?: bigint, identityCommitment?: bigint) {
    const { config, error: prepareError } = usePrepareContractWrite({
        address: CONTRACT_ADDRESSES.EEGVerifier,
        abi: EEGVerifierABI,
        functionName: 'addGroupMember',
        args: groupId && identityCommitment ? [groupId, identityCommitment] : undefined,
        enabled: !!(groupId && identityCommitment),
    });

    const { data, error, isLoading, write } = useContractWrite(config);

    const { isLoading: isTransactionLoading, isSuccess } = useWaitForTransaction({
        hash: data?.hash,
    });

    return {
        addGroupMember: write,
        data,
        error: error || prepareError,
        isLoading: isLoading || isTransactionLoading,
        isSuccess,
        transactionHash: data?.hash,
    };
}

export function useGetGroupInfo(groupId?: number) {
    return useContractRead({
        address: CONTRACT_ADDRESSES.EEGVerifier,
        abi: EEGVerifierABI,
        functionName: 'getGroupInfo',
        args: groupId !== undefined ? [BigInt(groupId)] : undefined,
        enabled: groupId !== undefined,
    });
}

export function useVerifyProof(
    merkleTreeRoot?: bigint,
    nullifierHash?: bigint,
    signal?: bigint,
    groupId?: bigint,
    proof?: any
) {
    const { config, error: prepareError } = usePrepareContractWrite({
        address: CONTRACT_ADDRESSES.EEGVerifier,
        abi: EEGVerifierABI,
        functionName: 'verifyProof',
        args: merkleTreeRoot && nullifierHash && signal && groupId && proof
            ? [merkleTreeRoot, nullifierHash, signal, groupId, proof]
            : undefined,
        enabled: !!(merkleTreeRoot && nullifierHash && signal && groupId && proof),
    });

    const { data, error, isLoading, write } = useContractWrite(config);

    const { isLoading: isTransactionLoading, isSuccess } = useWaitForTransaction({
        hash: data?.hash,
    });

    return {
        verifyProof: write,
        data,
        error: error || prepareError,
        isLoading: isLoading || isTransactionLoading,
        isSuccess,
        transactionHash: data?.hash,
    };
}

export function useIsNullifierUsed(nullifierHash?: string) {
    return useContractRead({
        address: CONTRACT_ADDRESSES.EEGVerifier,
        abi: EEGVerifierABI,
        functionName: 'isNullifierUsed',
        args: nullifierHash ? [BigInt(nullifierHash)] : undefined,
        enabled: !!nullifierHash,
    });
}

// Combined hooks for complex operations
export function useEEGIdentityRegistration() {
    return {
        useRegisterUser,
        useCreateGroup,
        useAddGroupMember,
    };
} 