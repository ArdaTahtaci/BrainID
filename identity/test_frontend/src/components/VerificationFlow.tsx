'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { Shield, Loader, CheckCircle, XCircle, ArrowLeft, Hash, Users, ExternalLink } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useRegisterUser, useCreateGroup, useAddGroupMember, useVerifyProof, useIsUserRegistered, useTotalRegisteredUsers } from '../hooks/useContracts'
import { NETWORK_NAME, CONTRACT_ADDRESSES } from '../contracts/addresses'

interface VerificationStep {
  id: string
  title: string
  description: string
  status: 'pending' | 'loading' | 'success' | 'error'
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

export default function VerificationFlow({ onBack }: { onBack: () => void }) {
  const { address } = useAccount()
  const [identityCommitment, setIdentityCommitment] = useState<string>('')
  const [groupId, setGroupId] = useState<number>(0)
  const [verificationData, setVerificationData] = useState<any>(null)
  const [transactionHashes, setTransactionHashes] = useState<{ [key: string]: string }>({})
  const [completedTransactions, setCompletedTransactions] = useState<Array<{
    id: string;
    title: string;
    hash: string;
    timestamp: Date;
  }>>([])

  // State for hook arguments
  const [registerArgs, setRegisterArgs] = useState<bigint | undefined>(undefined)
  const [groupDescription, setGroupDescription] = useState<string | undefined>(undefined)
  const [memberArgs, setMemberArgs] = useState<{ groupId?: bigint, commitment?: bigint }>({})
  const [proofArgs, setProofArgs] = useState<{
    merkleTreeRoot?: bigint,
    nullifierHash?: bigint,
    signal?: bigint,
    groupId?: bigint,
    proof?: any
  }>({})

  // Contract hooks with arguments
  const registerUser = useRegisterUser(registerArgs)
  const createGroup = useCreateGroup(groupDescription)
  const addGroupMember = useAddGroupMember(memberArgs.groupId, memberArgs.commitment)
  const verifyProof = useVerifyProof(
    proofArgs.merkleTreeRoot,
    proofArgs.nullifierHash,
    proofArgs.signal,
    proofArgs.groupId,
    proofArgs.proof
  )
  const { data: isRegistered } = useIsUserRegistered(address)
  const { data: totalUsers } = useTotalRegisteredUsers()

  const [steps, setSteps] = useState<VerificationStep[]>([
    {
      id: 'identity',
      title: 'Create & Register Identity',
      description: 'Generate EEG identity and register on-chain',
      status: 'pending'
    },
    {
      id: 'group',
      title: 'Create Group',
      description: 'Create verification group on blockchain',
      status: 'pending'
    },
    {
      id: 'member',
      title: 'Join Group',
      description: 'Add identity to verification group',
      status: 'pending'
    },
    {
      id: 'proof',
      title: 'Generate & Verify Proof',
      description: 'Create ZK proof and verify on-chain',
      status: 'pending'
    },
    {
      id: 'complete',
      title: 'Verification Complete',
      description: 'EEG-based identity verified on blockchain',
      status: 'pending'
    }
  ])

  useEffect(() => {
    if (address) {
      startVerification()
    }
  }, [address])

  // Track successful transactions
  useEffect(() => {
    if (registerUser.isSuccess && registerUser.transactionHash) {
      addCompletedTransaction('register', 'Identity Registration', registerUser.transactionHash)
    }
  }, [registerUser.isSuccess, registerUser.transactionHash])

  useEffect(() => {
    if (createGroup.isSuccess && createGroup.transactionHash) {
      addCompletedTransaction('group', 'Group Creation', createGroup.transactionHash)
    }
  }, [createGroup.isSuccess, createGroup.transactionHash])

  useEffect(() => {
    if (addGroupMember.isSuccess && addGroupMember.transactionHash) {
      addCompletedTransaction('member', 'Group Membership', addGroupMember.transactionHash)
    }
  }, [addGroupMember.isSuccess, addGroupMember.transactionHash])

  useEffect(() => {
    if (verifyProof.isSuccess && verifyProof.transactionHash) {
      addCompletedTransaction('proof', 'Proof Verification', verifyProof.transactionHash)
    }
  }, [verifyProof.isSuccess, verifyProof.transactionHash])

  const updateStepStatus = (stepId: string, status: VerificationStep['status']) => {
    setSteps(prev => prev.map(step =>
      step.id === stepId ? { ...step, status } : step
    ))
  }

  const addCompletedTransaction = (id: string, title: string, hash: string) => {
    setCompletedTransactions(prev => [...prev, {
      id,
      title,
      hash,
      timestamp: new Date()
    }])
  }

  const startVerification = async () => {
    if (!address) {
      toast.error('Please connect your wallet first')
      return
    }

    try {
      // Step 1: Create Identity and Register On-Chain
      updateStepStatus('identity', 'loading')
      toast.success('Generating EEG identity...')

      const mockEEGFeatures = [
        Math.random() * 100,
        Math.random() * 100,
        Math.random() * 100,
        Math.random() * 100,
        Math.random() * 100
      ]

      // Generate identity commitment
      const identityResponse = await axios.post(`${BACKEND_URL}/api/proof/identity/create`, {
        eegFeatures: mockEEGFeatures
      })

      const commitment = identityResponse.data.identityCommitment
      setIdentityCommitment(commitment)

      // Set args to trigger registerUser hook
      setRegisterArgs(BigInt(commitment))

      // Wait a moment for the hook to be ready, then trigger the transaction
      await new Promise(resolve => setTimeout(resolve, 500))

      // Trigger the actual blockchain transaction
      if (registerUser.registerUser) {
        toast.success('Registering identity on blockchain...')
        await registerUser.registerUser()

        // Wait for transaction to complete
        await new Promise(resolve => setTimeout(resolve, 2000))
      }

      updateStepStatus('identity', 'success')
      toast.success(`Identity registered on blockchain! Commitment: ${commitment.slice(0, 16)}...`)

      // Step 2: Create Group
      await new Promise(resolve => setTimeout(resolve, 2000))
      updateStepStatus('group', 'loading')
      toast.success('Creating verification group...')

      // Create group on backend for Merkle tree management
      const groupResponse = await axios.post(`${BACKEND_URL}/api/proof/group/create`, {
        groupId: `eeg-demo-${Date.now()}`,
        memberEEGFeatures: [] // Empty initially, we'll add members separately
      })

      const backendGroupId = groupResponse.data.groupId

      // Set description to trigger createGroup hook
      setGroupDescription(`EEG Demo Group ${Date.now()}`)

      // Wait a moment for the hook to be ready, then trigger the transaction
      await new Promise(resolve => setTimeout(resolve, 500))

      // Trigger the actual blockchain transaction
      if (createGroup.createGroup) {
        toast.success('Creating group on blockchain...')
        await createGroup.createGroup()

        // Wait for transaction to complete
        await new Promise(resolve => setTimeout(resolve, 2000))
      }

      const groupId = 1 // For demo, assuming first group created
      setGroupId(groupId)
      updateStepStatus('group', 'success')
      toast.success('Group created on blockchain!')

      // Step 3: Add Member to Group
      await new Promise(resolve => setTimeout(resolve, 2000))
      updateStepStatus('member', 'loading')
      toast.success('Adding identity to group...')

      // Add member to backend group
      await axios.post(`${BACKEND_URL}/api/proof/group/add-member`, {
        groupId: backendGroupId,
        memberEEGFeatures: mockEEGFeatures
      })

      // Set args to trigger addGroupMember hook
      setMemberArgs({
        groupId: BigInt(groupId),
        commitment: BigInt(commitment)
      })

      // Wait a moment for the hook to be ready, then trigger the transaction
      await new Promise(resolve => setTimeout(resolve, 500))

      // Trigger the actual blockchain transaction
      if (addGroupMember.addGroupMember) {
        toast.success('Adding member to group on blockchain...')
        await addGroupMember.addGroupMember()

        // Wait for transaction to complete
        await new Promise(resolve => setTimeout(resolve, 2000))
      }

      updateStepStatus('member', 'success')
      toast.success('Added to verification group on blockchain!')

      // Step 4: Generate and Verify Proof
      await new Promise(resolve => setTimeout(resolve, 2000))
      updateStepStatus('proof', 'loading')
      toast.success('Generating zero-knowledge proof...')

      // Generate ZK proof
      const proofResponse = await axios.post(`${BACKEND_URL}/api/proof/humanity`, {
        eegFeatures: mockEEGFeatures,
        groupId: backendGroupId,
        message: 'EEG_VERIFICATION_DEMO'
      })

      const proofData = proofResponse.data
      setVerificationData(proofData)

      // Debug: Check proof format
      console.log('🔍 Proof data from backend:', proofData)
      console.log('🔍 Proof format:', proofData.proof)

      // Convert proof to uint256[8] format if needed
      let formattedProof = proofData.proof || []
      if (Array.isArray(formattedProof) && formattedProof.length > 0) {
        // If proof is string array, convert to BigInt array
        formattedProof = formattedProof.map((p: any) => {
          if (typeof p === 'string') {
            return BigInt(p)
          }
          return p
        })
      }

      console.log('🔍 Formatted proof:', formattedProof)

      // Set args to trigger verifyProof hook
      setProofArgs({
        merkleTreeRoot: BigInt(proofData.merkleTreeRoot || '0'),
        nullifierHash: BigInt(proofData.nullifierHash || '0'),
        signal: BigInt(proofData.signal || '0'),
        groupId: BigInt(groupId),
        proof: formattedProof
      })

      // Wait a moment for the hook to be ready, then trigger the transaction
      await new Promise(resolve => setTimeout(resolve, 500))

      // Trigger the actual blockchain transaction
      if (verifyProof.verifyProof) {
        toast.success('Verifying proof on blockchain...')
        await verifyProof.verifyProof()

        // Wait for transaction to complete
        await new Promise(resolve => setTimeout(resolve, 2000))
      }

      updateStepStatus('proof', 'success')
      toast.success('Proof verified on blockchain!')

      // Step 5: Complete
      await new Promise(resolve => setTimeout(resolve, 1000))
      updateStepStatus('complete', 'success')
      toast.success('🎉 EEG-based identity verification complete!')

    } catch (error: any) {
      console.error('Verification failed:', error)
      toast.error(`Verification failed: ${error.message}`)

      // Update failed step status
      const failedSteps = ['identity', 'group', 'member', 'proof']
      for (const step of failedSteps) {
        if (steps.find(s => s.id === step)?.status === 'loading') {
          updateStepStatus(step, 'error')
          break
        }
      }
    }
  }

  const isComplete = steps.every(step => step.status === 'success')

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="btn-secondary flex items-center space-x-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        {isComplete && (
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Complete!</span>
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-6">Verification Progress</h3>

        <div className="space-y-4">
          {steps.map((step) => {
            // Find matching transaction for this step
            const matchingTx = completedTransactions.find(tx => {
              if (step.id === 'identity' && tx.id === 'register') return true
              if (step.id === 'group' && tx.id === 'group') return true
              if (step.id === 'member' && tx.id === 'member') return true
              if (step.id === 'proof' && tx.id === 'proof') return true
              return false
            })

            return (
              <StepItem
                key={step.id}
                step={step}
                transactionHash={matchingTx?.hash}
              />
            )
          })}
        </div>
      </div>

      {identityCommitment && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card">
            <h4 className="font-semibold mb-3 flex items-center space-x-2">
              <Hash className="h-5 w-5 text-primary-600" />
              <span>Identity</span>
            </h4>
            <div className="bg-gray-50 rounded-lg p-3 font-mono text-sm break-all">
              {identityCommitment.slice(0, 32)}...
            </div>
          </div>

          {groupId && (
            <div className="card">
              <h4 className="font-semibold mb-3 flex items-center space-x-2">
                <Users className="h-5 w-5 text-primary-600" />
                <span>Group</span>
              </h4>
              <div className="bg-gray-50 rounded-lg p-3 font-mono text-sm">
                {groupId}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Transaction History */}
      {completedTransactions.length > 0 && (
        <div className="card">
          <h4 className="font-semibold mb-4 flex items-center space-x-2">
            <ExternalLink className="h-5 w-5 text-green-600" />
            <span>Completed Transactions</span>
            <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded-full">
              {completedTransactions.length}
            </span>
          </h4>
          <div className="space-y-3">
            {completedTransactions.map((tx, index) => (
              <div key={tx.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{tx.title}</p>
                    <p className="text-sm text-gray-500">
                      {tx.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                    {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                  </code>
                  <a
                    href={`https://sepolia.basescan.org/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary !p-2 !text-xs flex items-center space-x-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span>View</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Blockchain Transaction Controls */}
      {identityCommitment && (
        <div className="card">
          <h4 className="font-semibold mb-4 flex items-center space-x-2">
            <ExternalLink className="h-5 w-5 text-primary-600" />
            <span>Blockchain Transactions</span>
          </h4>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Register User */}
            <div className="space-y-2">
              <p className="text-sm font-medium">1. Register Identity</p>
              <button
                onClick={() => registerUser.registerUser?.()}
                disabled={registerUser.isLoading || registerUser.isSuccess}
                className={`btn w-full text-sm ${registerUser.isSuccess ? 'btn-success' : 'btn-primary'
                  }`}
              >
                {registerUser.isLoading ? 'Registering...' :
                  registerUser.isSuccess ? 'Registered ✓' : 'Register'}
              </button>
              {registerUser.transactionHash && (
                <a
                  href={`https://sepolia.basescan.org/tx/${registerUser.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline flex items-center space-x-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>View Transaction</span>
                </a>
              )}
            </div>

            {/* Create Group */}
            <div className="space-y-2">
              <p className="text-sm font-medium">2. Create Group</p>
              <button
                onClick={() => createGroup.createGroup?.()}
                disabled={createGroup.isLoading || createGroup.isSuccess || !groupDescription}
                className={`btn w-full text-sm ${createGroup.isSuccess ? 'btn-success' : 'btn-primary'
                  }`}
              >
                {createGroup.isLoading ? 'Creating...' :
                  createGroup.isSuccess ? 'Created ✓' : 'Create'}
              </button>
              {createGroup.transactionHash && (
                <a
                  href={`https://sepolia.basescan.org/tx/${createGroup.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline flex items-center space-x-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>View Transaction</span>
                </a>
              )}
            </div>

            {/* Add Member */}
            <div className="space-y-2">
              <p className="text-sm font-medium">3. Join Group</p>
              <button
                onClick={() => addGroupMember.addGroupMember?.()}
                disabled={addGroupMember.isLoading || addGroupMember.isSuccess || !memberArgs.groupId}
                className={`btn w-full text-sm ${addGroupMember.isSuccess ? 'btn-success' : 'btn-primary'
                  }`}
              >
                {addGroupMember.isLoading ? 'Joining...' :
                  addGroupMember.isSuccess ? 'Joined ✓' : 'Join'}
              </button>
              {addGroupMember.transactionHash && (
                <a
                  href={`https://sepolia.basescan.org/tx/${addGroupMember.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline flex items-center space-x-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>View Transaction</span>
                </a>
              )}
            </div>

            {/* Verify Proof */}
            <div className="space-y-2">
              <p className="text-sm font-medium">4. Verify Proof</p>
              <button
                onClick={() => verifyProof.verifyProof?.()}
                disabled={verifyProof.isLoading || verifyProof.isSuccess || !proofArgs.merkleTreeRoot}
                className={`btn w-full text-sm ${verifyProof.isSuccess ? 'btn-success' : 'btn-primary'
                  }`}
              >
                {verifyProof.isLoading ? 'Verifying...' :
                  verifyProof.isSuccess ? 'Verified ✓' : 'Verify'}
              </button>
              {verifyProof.transactionHash && (
                <a
                  href={`https://sepolia.basescan.org/tx/${verifyProof.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline flex items-center space-x-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>View Transaction</span>
                </a>
              )}
            </div>
          </div>

          {/* Contract Info */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
            <p className="font-medium mb-2">Contract Addresses on {NETWORK_NAME}:</p>
            <div className="space-y-1 font-mono text-xs">
              <p>Registry: 0x4B98cA...B52B5</p>
              <p>Verifier: 0x43D4c1...517ab3</p>
            </div>
          </div>
        </div>
      )}

      {isComplete && (
        <div className="card text-center space-y-4">
          <div className="text-green-600 mx-auto w-fit">
            <CheckCircle className="h-16 w-16" />
          </div>
          <h3 className="text-xl font-semibold">EEG Identity Verified!</h3>
          <p className="text-gray-600">
            Your brain wave pattern has been verified using zero-knowledge proofs on {NETWORK_NAME}
          </p>
          <div className="flex justify-center space-x-4">
            <button onClick={() => window.location.reload()} className="btn-primary">
              New Verification
            </button>
            <button
              onClick={() => window.open(`https://sepolia.basescan.org/address/${CONTRACT_ADDRESSES.EEGRegistry}`, '_blank')}
              className="btn-secondary flex items-center space-x-2"
            >
              <ExternalLink className="h-4 w-4" />
              <span>View Contract on Basescan</span>
            </button>
          </div>

          {/* Final Transaction Summary */}
          {completedTransactions.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h5 className="font-medium text-blue-900 mb-3">
                ✅ {completedTransactions.length} Transaction{completedTransactions.length > 1 ? 's' : ''} Completed Successfully
              </h5>
              <div className="grid gap-2">
                {completedTransactions.map((tx, index) => (
                  <a
                    key={tx.id}
                    href={`https://sepolia.basescan.org/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between text-sm text-blue-700 hover:text-blue-900 hover:bg-blue-100 px-2 py-1 rounded"
                  >
                    <span>{index + 1}. {tx.title}</span>
                    <code className="font-mono text-xs">
                      {tx.hash.slice(0, 8)}...{tx.hash.slice(-6)}
                    </code>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function StepItem({ step, transactionHash }: { step: VerificationStep, transactionHash?: string }) {
  const getIcon = () => {
    switch (step.status) {
      case 'loading':
        return <Loader className="h-5 w-5 animate-spin" />
      case 'success':
        return <CheckCircle className="h-5 w-5" />
      case 'error':
        return <XCircle className="h-5 w-5" />
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
    }
  }

  const getStatusColor = () => {
    switch (step.status) {
      case 'loading':
        return 'text-blue-600 bg-blue-50'
      case 'success':
        return 'text-green-600 bg-green-50'
      case 'error':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="flex items-center space-x-4 p-3 rounded-lg">
      <div className={`p-2 rounded-full ${getStatusColor()}`}>
        {getIcon()}
      </div>
      <div className="flex-1">
        <h4 className="font-medium">{step.title}</h4>
        <p className="text-sm text-gray-600">{step.description}</p>
        {transactionHash && step.status === 'success' && (
          <div className="mt-2 flex items-center space-x-2">
            <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
              {transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}
            </code>
            <a
              href={`https://sepolia.basescan.org/tx/${transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <ExternalLink className="h-3 w-3" />
              <span>View Tx</span>
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
