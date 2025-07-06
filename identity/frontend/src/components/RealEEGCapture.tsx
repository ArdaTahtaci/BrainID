'use client'

import { useState } from 'react'
import {
    Brain,
    Zap,
    CheckCircle,
    AlertCircle,
    Loader2,
    Activity,
    Signal
} from 'lucide-react'

interface RealEEGCaptureProps {
    onComplete: (result: any) => void
}

interface EEGResponse {
    success: boolean
    brain_key: string
    features: number[]
    key_length: number
    feature_count: number
    status: string
    timestamp: number
}

export default function RealEEGCapture({ onComplete }: RealEEGCaptureProps) {
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState<'ready' | 'capturing' | 'processing' | 'complete'>('ready')
    const [error, setError] = useState<string | null>(null)
    const [eegData, setEegData] = useState<EEGResponse | null>(null)

    const handleEEGScan = async () => {
        try {
            setLoading(true)
            setError(null)
            setStep('capturing')

            console.log('Starting EEG scan...')

            // 1. Get EEG data from Flask server
            const flaskResponse = await fetch('http://localhost:5000/api/generate_key', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({})
            })

            if (!flaskResponse.ok) {
                throw new Error(`Flask server error: ${flaskResponse.status}`)
            }

            const eegData: EEGResponse = await flaskResponse.json()
            console.log('EEG data received:', eegData)

            if (!eegData.success) {
                throw new Error(`EEG generation failed: ${eegData.status}`)
            }

            setEegData(eegData)

            // 🎯 Demo delay: Wait 1.5 seconds after EEG capture
            console.log('EEG capture complete, waiting 1.5s for demo...')
            await new Promise(resolve => setTimeout(resolve, 1500))

            setStep('processing')

            // 2. Send EEG features to our backend (Merkle tree)
            const backendResponse = await fetch('http://localhost:8000/api/merkle/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    features: eegData.features
                })
            })

            if (!backendResponse.ok) {
                throw new Error(`Backend error: ${backendResponse.status}`)
            }

            const result = await backendResponse.json()
            console.log('Identity created:', result)

            // 🎯 Demo delay: Wait 1.5 seconds after processing
            console.log('Processing complete, waiting 1.5s for demo...')
            await new Promise(resolve => setTimeout(resolve, 1500))

            setStep('complete')
            setLoading(false)

            // Pass complete result to parent
            onComplete({
                eegData,
                identity: result,
                success: true
            })

        } catch (err: any) {
            console.error('EEG scan error:', err)
            setError(err.message || 'EEG scan failed')
            setLoading(false)
            setStep('ready')
        }
    }

    const getStepIcon = () => {
        switch (step) {
            case 'ready':
                return <Brain className="h-8 w-8 text-cyan-400" />
            case 'capturing':
                return <Activity className="h-8 w-8 text-yellow-400 animate-pulse" />
            case 'processing':
                return <Zap className="h-8 w-8 text-purple-400 animate-bounce" />
            case 'complete':
                return <CheckCircle className="h-8 w-8 text-green-400" />
            default:
                return <Brain className="h-8 w-8 text-cyan-400" />
        }
    }

    const getStepText = () => {
        switch (step) {
            case 'ready':
                return 'Ready to capture EEG data'
            case 'capturing':
                return 'Capturing brainwave patterns...'
            case 'processing':
                return 'Creating identity commitment...'
            case 'complete':
                return 'EEG identity created successfully!'
            default:
                return 'Ready'
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Status Card */}
            <div className="glass p-8 text-center">
                <div className="flex flex-col items-center space-y-6">
                    {/* Icon */}
                    <div className="relative">
                        {getStepIcon()}
                        {loading && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-white/50" />
                            </div>
                        )}
                    </div>

                    {/* Status Text */}
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">
                            Real EEG Capture
                        </h2>
                        <p className="text-cyan-300 text-lg">
                            {getStepText()}
                        </p>
                    </div>

                    {/* Progress Bar */}
                    {loading && (
                        <div className="w-full max-w-md">
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-500"
                                    style={{
                                        width: step === 'capturing' ? '33%' :
                                            step === 'processing' ? '66%' :
                                                step === 'complete' ? '100%' : '0%'
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Action Button */}
                    <button
                        onClick={handleEEGScan}
                        disabled={loading}
                        className={`px-8 py-3 rounded-lg font-semibold transition-all duration-200 ${loading
                            ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                            : 'bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
                            }`}
                    >
                        {loading ? 'Scanning...' : 'Start EEG Scan'}
                    </button>

                    {/* Error Display */}
                    {error && (
                        <div className="flex items-center space-x-2 text-red-400 bg-red-500/10 px-4 py-2 rounded-lg">
                            <AlertCircle className="h-5 w-5" />
                            <span>{error}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* EEG Data Display */}
            {eegData && (
                <div className="glass p-6">
                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                        <Signal className="h-6 w-6 text-cyan-400" />
                        <span>EEG Capture Results</span>
                    </h3>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-white/5 p-4 rounded-lg">
                            <p className="text-cyan-300 text-sm">Brain Key Length</p>
                            <p className="text-white text-2xl font-bold">{eegData.key_length} characters</p>
                        </div>

                        <div className="bg-white/5 p-4 rounded-lg">
                            <p className="text-cyan-300 text-sm">Feature Count</p>
                            <p className="text-white text-2xl font-bold">{eegData.feature_count} features</p>
                        </div>

                        <div className="bg-white/5 p-4 rounded-lg">
                            <p className="text-cyan-300 text-sm">Status</p>
                            <p className="text-green-400 text-lg font-semibold">{eegData.status}</p>
                        </div>

                        <div className="bg-white/5 p-4 rounded-lg">
                            <p className="text-cyan-300 text-sm">Timestamp</p>
                            <p className="text-white text-sm">{new Date(eegData.timestamp * 1000).toLocaleTimeString()}</p>
                        </div>
                    </div>

                    <div className="mt-4 bg-white/5 p-4 rounded-lg">
                        <p className="text-cyan-300 text-sm mb-2">Brain Key Preview</p>
                        <p className="text-white text-xs font-mono break-all">
                            {eegData.brain_key.substring(0, 100)}...
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
} 