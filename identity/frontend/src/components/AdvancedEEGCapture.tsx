'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Brain, Activity, Zap, CheckCircle, AlertCircle, Signal, Loader2, Wifi, WifiOff, Database, Settings, ArrowRight, Copy } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { io, Socket } from 'socket.io-client'

interface AdvancedEEGCaptureProps {
    onComplete: (result: any) => void
}

interface EEGChannelData {
    channel: number
    value: number
    active: boolean
}

interface EEGStatus {
    esp32Connected: boolean
    bufferReady: boolean
    isProcessing: boolean
    sampleRate: number
    channels: number
}

interface BrainKeyData {
    success?: boolean
    brain_key: string
    features: number[]
    key_length: number
    feature_count: number
    status: string
    timestamp: number
    consistency?: number
}

interface FrequencyBand {
    name: string
    range: string
    color: string
    symbol: string
}

const frequencyBands: FrequencyBand[] = [
    { name: 'Delta', range: '0.5-4.0 Hz', color: 'bg-purple-500', symbol: 'δ' },
    { name: 'Theta', range: '4.0-8.0 Hz', color: 'bg-blue-500', symbol: 'θ' },
    { name: 'Alpha', range: '8.0-12.0 Hz', color: 'bg-green-500', symbol: 'α' },
    { name: 'Beta', range: '12.0-30.0 Hz', color: 'bg-yellow-500', symbol: 'β' },
    { name: 'Gamma', range: '30.0-50.0 Hz', color: 'bg-red-500', symbol: 'γ' }
]

export default function AdvancedEEGCapture({ onComplete }: AdvancedEEGCaptureProps) {
    // State management
    const [esp32IP, setEsp32IP] = useState('192.168.1.100')
    const [status, setStatus] = useState<EEGStatus>({
        esp32Connected: false,
        bufferReady: false,
        isProcessing: false,
        sampleRate: 100,
        channels: 8
    })
    const [channelData, setChannelData] = useState<EEGChannelData[]>(
        Array(8).fill(0).map((_, i) => ({ channel: i, value: 0, active: false }))
    )
    const [currentBrainKey, setCurrentBrainKey] = useState<BrainKeyData | null>(null)
    const [previousBrainKey, setPreviousBrainKey] = useState<BrainKeyData | null>(null)
    const [keyGenerationCount, setKeyGenerationCount] = useState(0)
    const [isGenerating, setIsGenerating] = useState(false)
    const [progress, setProgress] = useState(0)
    const [showComparison, setShowComparison] = useState(false)

    // Socket.IO reference
    const socketRef = useRef<Socket | null>(null)

    // Initialize Socket.IO connection
    useEffect(() => {
        // Connect to Flask Socket.IO server
        socketRef.current = io('http://localhost:5000')

        // Socket event listeners
        socketRef.current.on('connect', () => {
            console.log('Connected to Flask Socket.IO server')
            toast.success('Connected to EEG server')
        })

        socketRef.current.on('disconnect', () => {
            console.log('Disconnected from Flask Socket.IO server')
        })

        socketRef.current.on('esp32_status', (data) => {
            console.log('ESP32 status update:', data)
            if (data.status === 'connected') {
                setStatus(prev => ({ ...prev, esp32Connected: true }))
                setProgress(0)
            } else if (data.status === 'disconnected') {
                setStatus(prev => ({ ...prev, esp32Connected: false, bufferReady: false }))
                setProgress(0)
            }
        })

        socketRef.current.on('eeg_data', (data) => {
            console.log('Real-time EEG data received:', data)
            if (data.channels && Array.isArray(data.channels)) {
                setChannelData(prev =>
                    prev.map((channel, index) => {
                        const newValue = data.channels[index] || 0
                        const active = Math.abs(newValue) > 10
                        return { ...channel, value: newValue, active }
                    })
                )
            }
        })

        // Request real-time data when connected
        const interval = setInterval(() => {
            if (status.esp32Connected && socketRef.current) {
                socketRef.current.emit('request_eeg_data')
            }
        }, 100) // 100ms = 10Hz update rate

        return () => {
            clearInterval(interval)
            if (socketRef.current) {
                socketRef.current.disconnect()
            }
        }
    }, [])

    // Simulate real-time channel data updates
    const updateChannelData = () => {
        setChannelData(prev =>
            prev.map(channel => {
                const newValue = (Math.random() - 0.5) * 100 // -50 to +50 μV
                const active = Math.abs(newValue) > 10
                return { ...channel, value: newValue, active }
            })
        )
    }

    // Update buffer status
    const updateBufferStatus = () => {
        if (!status.bufferReady) {
            setProgress(prev => {
                const newProgress = Math.min(100, prev + Math.random() * 5)
                if (newProgress >= 100) {
                    setStatus(prev => ({ ...prev, bufferReady: true }))
                }
                return newProgress
            })
        }
    }

    // Connect to ESP32
    const connectESP32 = async () => {
        if (!esp32IP.trim()) {
            toast.error('Please enter ESP32 IP address')
            return
        }

        try {
            toast.loading('Connecting to ESP32...')

            // Call Flask API to connect to ESP32
            const response = await fetch('http://localhost:5000/api/connect_esp32', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ esp32_ip: esp32IP })
            })

            const data = await response.json()

            if (response.ok && data.status === 'connecting') {
                toast.dismiss()
                toast.success('ESP32 connection initiated...')
                // Status will be updated via Socket.IO
            } else {
                throw new Error(data.message || 'Connection failed')
            }

        } catch (error: any) {
            toast.dismiss()
            toast.error(`Failed to connect to ESP32: ${error.message}`)
        }
    }

    // Disconnect from ESP32
    const disconnectESP32 = () => {
        setStatus({
            esp32Connected: false,
            bufferReady: false,
            isProcessing: false,
            sampleRate: 100,
            channels: 8
        })
        setProgress(0)
        setChannelData(prev => prev.map(ch => ({ ...ch, value: 0, active: false })))
        toast.success('Disconnected from ESP32')
    }

    // Generate brain key with advanced features
    const generateBrainKey = async () => {
        if (!status.bufferReady) {
            toast.error('Please wait for data buffer to fill')
            return
        }

        setIsGenerating(true)
        setStatus(prev => ({ ...prev, isProcessing: true }))

        try {
            toast.loading('Generating brain key from EEG data...')

            // Call Flask API
            const response = await fetch('http://localhost:5000/api/generate_key', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            })

            if (!response.ok) {
                throw new Error(`Flask server error: ${response.status}`)
            }

            const data: BrainKeyData = await response.json()

            if (!data.success) {
                throw new Error(`EEG generation failed: ${data.status}`)
            }

            // Calculate consistency if we have a previous key
            if (previousBrainKey) {
                const consistency = calculateKeyConsistency(data.brain_key, previousBrainKey.brain_key)
                data.consistency = consistency
            }

            setCurrentBrainKey(data)
            setKeyGenerationCount(prev => prev + 1)
            setShowComparison(!!previousBrainKey)

            toast.dismiss()
            toast.success('Brain key generated successfully!')

            // Pass to parent component
            onComplete({
                eegData: data,
                channelData: channelData,
                consistency: data.consistency,
                generationCount: keyGenerationCount + 1,
                success: true
            })

        } catch (error: any) {
            toast.dismiss()
            toast.error(`Generation failed: ${error.message}`)
        } finally {
            setIsGenerating(false)
            setStatus(prev => ({ ...prev, isProcessing: false }))
        }
    }

    // Generate second key for comparison
    const generateSecondKey = async () => {
        if (currentBrainKey) {
            setPreviousBrainKey(currentBrainKey)
        }
        await generateBrainKey()
    }

    // Calculate key consistency
    const calculateKeyConsistency = (key1: string, key2: string): number => {
        if (key1.length !== key2.length) return 0

        let matches = 0
        for (let i = 0; i < key1.length; i++) {
            if (key1[i] === key2[i]) matches++
        }

        return (matches / key1.length) * 100
    }

    // Copy key to clipboard
    const copyKey = () => {
        if (currentBrainKey) {
            navigator.clipboard.writeText(currentBrainKey.brain_key)
            toast.success('Brain key copied to clipboard!')
        }
    }

    // Status indicator component
    const StatusIndicator = ({ connected, label, icon: Icon }: { connected: boolean, label: string, icon: any }) => (
        <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm p-4 rounded-lg">
            <div className={`p-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}>
                <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
                <p className="text-white font-medium">{label}</p>
                <p className="text-sm text-white/70">{connected ? 'Connected' : 'Disconnected'}</p>
            </div>
        </div>
    )

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Status Dashboard */}
            <div className="glass p-6">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
                    <Brain className="h-8 w-8 text-cyan-400" />
                    <span>Advanced EEG Monitoring</span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <StatusIndicator connected={status.esp32Connected} label="ESP32 Connection" icon={status.esp32Connected ? Wifi : WifiOff} />
                    <StatusIndicator connected={status.bufferReady} label="Data Buffer" icon={Database} />
                    <StatusIndicator connected={status.isProcessing} label="Processing" icon={status.isProcessing ? Loader2 : CheckCircle} />
                </div>

                {/* ESP32 Connection */}
                <div className="bg-white/5 p-4 rounded-lg mb-6">
                    <h3 className="text-lg font-semibold text-white mb-3">ESP32 Connection</h3>
                    <div className="flex space-x-3">
                        <input
                            type="text"
                            value={esp32IP}
                            onChange={(e) => setEsp32IP(e.target.value)}
                            placeholder="ESP32 IP Address"
                            className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50"
                            disabled={status.esp32Connected}
                        />
                        <button
                            onClick={status.esp32Connected ? disconnectESP32 : connectESP32}
                            className={`px-6 py-2 rounded-lg font-medium transition-colors ${status.esp32Connected
                                ? 'bg-red-500 hover:bg-red-600 text-white'
                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                                }`}
                        >
                            {status.esp32Connected ? 'Disconnect' : 'Connect'}
                        </button>
                    </div>
                </div>

                {/* Buffer Progress */}
                {status.esp32Connected && !status.bufferReady && (
                    <div className="bg-white/5 p-4 rounded-lg mb-6">
                        <h3 className="text-lg font-semibold text-white mb-3">Data Buffer Status</h3>
                        <div className="w-full bg-white/10 rounded-full h-3">
                            <div
                                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-3 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="text-white/70 text-sm mt-2">Collecting 2-second buffer: {progress.toFixed(1)}%</p>
                    </div>
                )}
            </div>

            {/* Real-time Channel Monitoring */}
            {status.esp32Connected && (
                <div className="glass p-6">
                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                        <Activity className="h-6 w-6 text-cyan-400" />
                        <span>Real-time EEG Channels</span>
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {channelData.map((channel) => (
                            <div
                                key={channel.channel}
                                className={`p-4 rounded-lg border-2 transition-all duration-200 ${channel.active
                                    ? 'border-green-400 bg-green-500/10'
                                    : 'border-white/20 bg-white/5'
                                    }`}
                            >
                                <div className="text-center">
                                    <div className="text-lg font-bold text-white mb-1">
                                        Ch {channel.channel}
                                    </div>
                                    <div className="text-sm text-white/70">
                                        {channel.value.toFixed(2)} μV
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* System Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-cyan-400">{status.sampleRate}</div>
                            <div className="text-sm text-white/70">Sample Rate (Hz)</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-cyan-400">{status.channels}</div>
                            <div className="text-sm text-white/70">EEG Channels</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-cyan-400">{keyGenerationCount}</div>
                            <div className="text-sm text-white/70">Keys Generated</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-cyan-400">
                                {currentBrainKey?.consistency?.toFixed(1) || 0}%
                            </div>
                            <div className="text-sm text-white/70">Consistency</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Frequency Bands */}
            <div className="glass p-6">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                    <Signal className="h-6 w-6 text-cyan-400" />
                    <span>Frequency Bands Analyzed</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {frequencyBands.map((band) => (
                        <div key={band.name} className="bg-white/5 p-4 rounded-lg text-center">
                            <div className={`w-12 h-12 rounded-full ${band.color} mx-auto mb-2 flex items-center justify-center text-white font-bold text-xl`}>
                                {band.symbol}
                            </div>
                            <div className="text-white font-medium">{band.name}</div>
                            <div className="text-white/70 text-sm">{band.range}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Key Generation */}
            <div className="glass p-6">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                    <Zap className="h-6 w-6 text-cyan-400" />
                    <span>Brain Key Generation</span>
                </h3>

                <div className="space-y-4">
                    <div className="flex space-x-4">
                        <button
                            onClick={generateBrainKey}
                            disabled={!status.bufferReady || isGenerating}
                            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${!status.bufferReady || isGenerating
                                ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                                : 'bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white'
                                }`}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                                    Generating...
                                </>
                            ) : (
                                'Generate Brain Key'
                            )}
                        </button>

                        {currentBrainKey && (
                            <button
                                onClick={generateSecondKey}
                                disabled={isGenerating}
                                className="px-6 py-3 rounded-lg font-semibold bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white transition-all duration-200"
                            >
                                Test Consistency
                            </button>
                        )}
                    </div>

                    {/* Brain Key Display */}
                    {currentBrainKey && (
                        <div className="bg-white/5 p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-white font-medium">Generated Brain Key</h4>
                                <button
                                    onClick={copyKey}
                                    className="flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 transition-colors"
                                >
                                    <Copy className="h-4 w-4" />
                                    <span className="text-sm">Copy</span>
                                </button>
                            </div>
                            <div className="bg-gray-900 p-3 rounded font-mono text-sm text-green-400 max-h-32 overflow-y-auto">
                                {currentBrainKey.brain_key}
                            </div>
                            <div className="mt-3 text-sm text-white/70">
                                Length: {currentBrainKey.key_length} characters |
                                Features: {currentBrainKey.feature_count} |
                                Generated: {new Date(currentBrainKey.timestamp * 1000).toLocaleTimeString()}
                            </div>
                        </div>
                    )}

                    {/* Key Comparison */}
                    {showComparison && previousBrainKey && currentBrainKey && (
                        <div className="bg-white/5 p-4 rounded-lg">
                            <h4 className="text-white font-medium mb-3">Key Consistency Analysis</h4>

                            {currentBrainKey.consistency !== undefined && (
                                <div className={`p-3 rounded-lg mb-3 ${currentBrainKey.consistency > 85
                                    ? 'bg-green-500/20 border border-green-500/50'
                                    : currentBrainKey.consistency > 50
                                        ? 'bg-yellow-500/20 border border-yellow-500/50'
                                        : 'bg-red-500/20 border border-red-500/50'
                                    }`}>
                                    <div className="flex items-center justify-between">
                                        <span className="text-white font-medium">
                                            {currentBrainKey.consistency > 85 ? '✅ Excellent Consistency' :
                                                currentBrainKey.consistency > 50 ? '⚠️ Moderate Consistency' :
                                                    '❌ Low Consistency'}
                                        </span>
                                        <span className="text-white font-bold">
                                            {currentBrainKey.consistency.toFixed(1)}%
                                        </span>
                                    </div>
                                    <p className="text-white/70 text-sm mt-1">
                                        {currentBrainKey.consistency > 85 ?
                                            'Keys are highly consistent. The 15% tolerance is working perfectly.' :
                                            currentBrainKey.consistency > 50 ?
                                                'Keys show moderate consistency. Consider checking electrode connections.' :
                                                'Keys are very different. Check for movement, interference, or electrode issues.'}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
} 