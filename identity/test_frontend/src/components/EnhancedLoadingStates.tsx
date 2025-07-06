'use client'

import React from 'react'
import { Loader, CheckCircle, XCircle, Clock, ArrowRight, Zap } from 'lucide-react'

interface LoadingStepProps {
    title: string
    description: string
    status: 'pending' | 'loading' | 'success' | 'error'
    estimatedTime?: string
    transactionHash?: string
}

interface EnhancedLoadingStatesProps {
    steps: LoadingStepProps[]
    currentStep: number
    onRetry?: () => void
    showProgress?: boolean
}

export default function EnhancedLoadingStates({
    steps,
    currentStep,
    onRetry,
    showProgress = true
}: EnhancedLoadingStatesProps) {

    const getStepIcon = (status: string, isActive: boolean) => {
        switch (status) {
            case 'loading':
                return <Loader className="w-5 h-5 animate-spin text-blue-500" />
            case 'success':
                return <CheckCircle className="w-5 h-5 text-green-500" />
            case 'error':
                return <XCircle className="w-5 h-5 text-red-500" />
            default:
                return (
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isActive
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300'
                        }`}>
                        {isActive && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                    </div>
                )
        }
    }

    const getStepStatus = (stepIndex: number) => {
        if (stepIndex < currentStep) return 'success'
        if (stepIndex === currentStep) return steps[stepIndex]?.status || 'pending'
        return 'pending'
    }

    const calculateProgress = () => {
        const completedSteps = steps.filter(step => step.status === 'success').length
        return (completedSteps / steps.length) * 100
    }

    const getLoadingMessage = (status: string) => {
        switch (status) {
            case 'loading':
                return 'Processing...'
            case 'success':
                return 'Complete!'
            case 'error':
                return 'Failed'
            default:
                return 'Waiting...'
        }
    }

    return (
        <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
            {/* Progress Bar */}
            {showProgress && (
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">
                            Progress: {Math.round(calculateProgress())}%
                        </span>
                        <span className="text-sm text-gray-500">
                            Step {currentStep + 1} of {steps.length}
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${calculateProgress()}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Steps */}
            <div className="space-y-4">
                {steps.map((step, index) => {
                    const stepStatus = getStepStatus(index)
                    const isActive = index === currentStep
                    const isCompleted = stepStatus === 'success'
                    const isFailed = stepStatus === 'error'
                    const isLoading = stepStatus === 'loading'

                    return (
                        <div
                            key={index}
                            className={`flex items-start space-x-3 p-4 rounded-lg border transition-all duration-200 ${isActive
                                    ? 'border-blue-200 bg-blue-50'
                                    : isCompleted
                                        ? 'border-green-200 bg-green-50'
                                        : isFailed
                                            ? 'border-red-200 bg-red-50'
                                            : 'border-gray-200 bg-gray-50'
                                }`}
                        >
                            {/* Step Icon */}
                            <div className="flex-shrink-0 mt-1">
                                {getStepIcon(stepStatus, isActive)}
                            </div>

                            {/* Step Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <h4 className={`text-sm font-medium ${isActive ? 'text-blue-900' :
                                            isCompleted ? 'text-green-900' :
                                                isFailed ? 'text-red-900' : 'text-gray-900'
                                        }`}>
                                        {step.title}
                                    </h4>
                                    {step.estimatedTime && isActive && (
                                        <div className="flex items-center text-xs text-gray-500">
                                            <Clock className="w-3 h-3 mr-1" />
                                            ~{step.estimatedTime}
                                        </div>
                                    )}
                                </div>

                                <p className={`text-sm mt-1 ${isActive ? 'text-blue-700' :
                                        isCompleted ? 'text-green-700' :
                                            isFailed ? 'text-red-700' : 'text-gray-600'
                                    }`}>
                                    {step.description}
                                </p>

                                {/* Loading Animation */}
                                {isLoading && (
                                    <div className="mt-2 flex items-center space-x-2">
                                        <div className="flex space-x-1">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-100"></div>
                                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-200"></div>
                                        </div>
                                        <span className="text-xs text-blue-600 font-medium">
                                            {getLoadingMessage(stepStatus)}
                                        </span>
                                    </div>
                                )}

                                {/* Transaction Hash */}
                                {step.transactionHash && (
                                    <div className="mt-2 flex items-center space-x-2">
                                        <Zap className="w-3 h-3 text-yellow-500" />
                                        <span className="text-xs text-gray-600 font-mono">
                                            {step.transactionHash.slice(0, 8)}...{step.transactionHash.slice(-6)}
                                        </span>
                                    </div>
                                )}

                                {/* Error Actions */}
                                {isFailed && onRetry && (
                                    <div className="mt-2">
                                        <button
                                            onClick={onRetry}
                                            className="text-xs text-red-600 hover:text-red-700 font-medium underline"
                                        >
                                            Retry Step
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Arrow to next step */}
                            {index < steps.length - 1 && isCompleted && (
                                <div className="flex-shrink-0 ml-2">
                                    <ArrowRight className="w-4 h-4 text-gray-400" />
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Summary */}
            <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-gray-600">
                                {steps.filter(s => s.status === 'success').length} completed
                            </span>
                        </div>
                        <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4 text-yellow-500" />
                            <span className="text-sm text-gray-600">
                                {steps.filter(s => s.status === 'loading').length} in progress
                            </span>
                        </div>
                        <div className="flex items-center space-x-1">
                            <XCircle className="w-4 h-4 text-red-500" />
                            <span className="text-sm text-gray-600">
                                {steps.filter(s => s.status === 'error').length} failed
                            </span>
                        </div>
                    </div>

                    {steps.every(s => s.status === 'success') && (
                        <div className="flex items-center space-x-2 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">All steps completed!</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
} 