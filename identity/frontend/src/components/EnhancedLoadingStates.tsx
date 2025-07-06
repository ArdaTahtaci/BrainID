'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader, CheckCircle, XCircle, AlertCircle, RefreshCw, Clock, ExternalLink } from 'lucide-react'

export interface LoadingState {
    id: string
    title: string
    description: string
    status: 'idle' | 'preparing' | 'loading' | 'success' | 'error' | 'retrying'
    progress?: number
    estimatedTime?: number
    startTime?: number
    errorMessage?: string
    retryCount?: number
    maxRetries?: number
    transactionHash?: string
    onRetry?: () => void
}

interface EnhancedLoadingStateProps {
    state: LoadingState
    onRetry?: () => void
    showTransactionLink?: boolean
    compact?: boolean
}

export function EnhancedLoadingState({
    state,
    onRetry,
    showTransactionLink = true,
    compact = false
}: EnhancedLoadingStateProps) {
    const [elapsedTime, setElapsedTime] = useState(0)
    const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(0)

    useEffect(() => {
        let interval: NodeJS.Timeout

        if (state.status === 'loading' || state.status === 'preparing') {
            interval = setInterval(() => {
                if (state.startTime) {
                    const elapsed = Math.floor((Date.now() - state.startTime) / 1000)
                    setElapsedTime(elapsed)

                    if (state.estimatedTime) {
                        const remaining = Math.max(0, state.estimatedTime - elapsed)
                        setEstimatedTimeRemaining(remaining)
                    }
                }
            }, 1000)
        }

        return () => {
            if (interval) {
                clearInterval(interval)
            }
        }
    }, [state.status, state.startTime, state.estimatedTime])

    const getStatusIcon = () => {
        switch (state.status) {
            case 'preparing':
                return <Loader className="h-5 w-5 animate-spin text-blue-500" />
            case 'loading':
                return <Loader className="h-5 w-5 animate-spin text-blue-500" />
            case 'success':
                return <CheckCircle className="h-5 w-5 text-green-500" />
            case 'error':
                return <XCircle className="h-5 w-5 text-red-500" />
            case 'retrying':
                return <RefreshCw className="h-5 w-5 animate-spin text-orange-500" />
            default:
                return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
        }
    }

    const getStatusColor = () => {
        switch (state.status) {
            case 'preparing':
                return 'bg-blue-50 border-blue-200'
            case 'loading':
                return 'bg-blue-50 border-blue-200'
            case 'success':
                return 'bg-green-50 border-green-200'
            case 'error':
                return 'bg-red-50 border-red-200'
            case 'retrying':
                return 'bg-orange-50 border-orange-200'
            default:
                return 'bg-gray-50 border-gray-200'
        }
    }

    const getProgressPercentage = () => {
        if (state.progress !== undefined) {
            return state.progress
        }

        if (state.estimatedTime && state.startTime) {
            const elapsed = Math.floor((Date.now() - state.startTime) / 1000)
            return Math.min(90, Math.floor((elapsed / state.estimatedTime) * 100))
        }

        return 0
    }

    const formatTime = (seconds: number) => {
        if (seconds < 60) {
            return `${seconds}s`
        }
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        return `${minutes}m ${remainingSeconds}s`
    }

    const getStatusMessage = () => {
        switch (state.status) {
            case 'preparing':
                return 'Preparing transaction...'
            case 'loading':
                return state.transactionHash ? 'Waiting for confirmation...' : 'Submitting transaction...'
            case 'success':
                return 'Completed successfully!'
            case 'error':
                return state.errorMessage || 'Operation failed'
            case 'retrying':
                return `Retrying... (${state.retryCount || 0}/${state.maxRetries || 3})`
            default:
                return 'Waiting to start...'
        }
    }

    if (compact) {
        return (
            <div className={`flex items-center space-x-3 p-3 rounded-lg border ${getStatusColor()}`}>
                {getStatusIcon()}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm truncate">{state.title}</h4>
                        {(state.status === 'loading' || state.status === 'preparing') && (
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                                <Clock className="h-3 w-3" />
                                <span>{formatTime(elapsedTime)}</span>
                            </div>
                        )}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{getStatusMessage()}</p>
                </div>
            </div>
        )
    }

    return (
        <div className={`p-4 rounded-lg border ${getStatusColor()}`}>
            <div className="flex items-start space-x-4">
                {getStatusIcon()}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{state.title}</h4>
                        {(state.status === 'loading' || state.status === 'preparing') && (
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                                <Clock className="h-4 w-4" />
                                <span>{formatTime(elapsedTime)}</span>
                            </div>
                        )}
                    </div>

                    <p className="text-sm text-gray-600 mb-3">{state.description}</p>

                    {/* Progress Bar */}
                    {(state.status === 'loading' || state.status === 'preparing') && (
                        <div className="mb-3">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>{getStatusMessage()}</span>
                                <span>{getProgressPercentage()}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${getProgressPercentage()}%` }}
                                />
                            </div>
                            {estimatedTimeRemaining > 0 && (
                                <div className="text-xs text-gray-500 mt-1">
                                    Estimated time remaining: {formatTime(estimatedTimeRemaining)}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Status Message */}
                    <div className="text-sm">
                        {state.status === 'error' && (
                            <div className="text-red-600 mb-2">
                                <AlertCircle className="h-4 w-4 inline mr-1" />
                                {state.errorMessage || 'Operation failed'}
                            </div>
                        )}

                        {state.status === 'success' && (
                            <div className="text-green-600 mb-2">
                                <CheckCircle className="h-4 w-4 inline mr-1" />
                                Completed successfully!
                            </div>
                        )}
                    </div>

                    {/* Transaction Hash */}
                    {state.transactionHash && showTransactionLink && (
                        <div className="mt-3 p-2 bg-gray-100 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <span className="text-xs text-gray-600">Transaction:</span>
                                    <code className="text-xs font-mono bg-white px-2 py-1 rounded">
                                        {state.transactionHash.slice(0, 10)}...{state.transactionHash.slice(-8)}
                                    </code>
                                </div>
                                <a
                                    href={`https://sepolia.basescan.org/tx/${state.transactionHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                                >
                                    <ExternalLink className="h-3 w-3" />
                                    <span>View</span>
                                </a>
                            </div>
                        </div>
                    )}

                    {/* Retry Button */}
                    {state.status === 'error' && (onRetry || state.onRetry) && (
                        <button
                            onClick={onRetry || state.onRetry}
                            className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 flex items-center space-x-2"
                        >
                            <RefreshCw className="h-4 w-4" />
                            <span>Retry</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

interface LoadingStatesManagerProps {
    states: LoadingState[]
    title?: string
    onRetry?: (stateId: string) => void
    compact?: boolean
}

export function LoadingStatesManager({
    states,
    title = "Operation Progress",
    onRetry,
    compact = false
}: LoadingStatesManagerProps) {
    const activeStates = states.filter(s => s.status !== 'idle')
    const completedCount = states.filter(s => s.status === 'success').length
    const totalCount = states.length
    const hasErrors = states.some(s => s.status === 'error')
    const isComplete = completedCount === totalCount

    const overallProgress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

    return (
        <div className="space-y-4">
            {title && (
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">
                            {completedCount}/{totalCount} completed
                        </span>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full transition-all duration-500 ${isComplete ? 'bg-green-500' : hasErrors ? 'bg-red-500' : 'bg-blue-500'
                                    }`}
                                style={{ width: `${overallProgress}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-3">
                {activeStates.map((state) => (
                    <EnhancedLoadingState
                        key={state.id}
                        state={state}
                        onRetry={onRetry ? () => onRetry(state.id) : undefined}
                        compact={compact}
                    />
                ))}
            </div>

            {isComplete && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="font-medium text-green-800">All operations completed successfully!</span>
                    </div>
                </div>
            )}
        </div>
    )
}

// Utility functions for creating loading states
export const createLoadingState = (
    id: string,
    title: string,
    description: string,
    estimatedTime?: number,
    maxRetries: number = 3
): LoadingState => ({
    id,
    title,
    description,
    status: 'idle',
    estimatedTime,
    maxRetries,
    retryCount: 0
})

export const updateLoadingState = (
    state: LoadingState,
    updates: Partial<LoadingState>
): LoadingState => ({
    ...state,
    ...updates,
    startTime: updates.status === 'loading' || updates.status === 'preparing'
        ? Date.now()
        : state.startTime
})

// Common loading states for EEG verification
export const createEEGVerificationStates = (): LoadingState[] => [
    createLoadingState(
        'identity',
        'Identity Creation',
        'Generating EEG-based identity commitment',
        15 // 15 seconds estimated
    ),
    createLoadingState(
        'registration',
        'Identity Registration',
        'Registering identity on blockchain',
        30 // 30 seconds estimated
    ),
    createLoadingState(
        'group',
        'Group Creation',
        'Creating verification group',
        25 // 25 seconds estimated
    ),
    createLoadingState(
        'membership',
        'Group Membership',
        'Adding identity to group',
        20 // 20 seconds estimated
    ),
    createLoadingState(
        'proof',
        'Proof Generation',
        'Generating zero-knowledge proof',
        45 // 45 seconds estimated
    ),
    createLoadingState(
        'verification',
        'Proof Verification',
        'Verifying proof on blockchain',
        35 // 35 seconds estimated
    )
] 