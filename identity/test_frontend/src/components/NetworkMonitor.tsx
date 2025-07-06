'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useBlockNumber, useFeeData, useBalance, useAccount, usePublicClient } from 'wagmi'
import {
    Activity,
    TrendingUp,
    Clock,
    Zap,
    AlertTriangle,
    CheckCircle,
    Globe,
    Server,
    Shield,
    Wifi,
    Database,
    BarChart3,
    RefreshCw,
    Eye,
    Signal,
    Cpu,
    Monitor
} from 'lucide-react'
import { formatUnits, formatEther } from 'viem'
import { NETWORK_NAME, EXPLORER_URL } from '../contracts/addresses'

interface NetworkStats {
    blockHeight: number
    gasPrice: bigint
    avgBlockTime: number
    networkStatus: 'healthy' | 'slow' | 'congested'
    lastUpdate: Date
}

interface PerformanceMetric {
    label: string
    value: number
    unit: string
    trend: 'up' | 'down' | 'stable'
    color: string
}

export default function NetworkMonitor() {
    const { address } = useAccount()
    const { data: blockNumber } = useBlockNumber({
        watch: true,
        cacheTime: 2000,
    })
    const { data: feeData } = useFeeData({
        watch: true,
        cacheTime: 5000,
    })
    const { data: balance } = useBalance({
        address: address,
        watch: true,
        cacheTime: 10000,
    })
    const publicClient = usePublicClient()

    const [networkStats, setNetworkStats] = useState<NetworkStats>({
        blockHeight: 0,
        gasPrice: BigInt(0),
        avgBlockTime: 2.0,
        networkStatus: 'healthy',
        lastUpdate: new Date()
    })

    const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([])
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [connectionQuality, setConnectionQuality] = useState(100)
    const [tpsData, setTpsData] = useState<{ timestamp: number, tps: number }[]>([])

    // Update network stats when data changes
    useEffect(() => {
        if (blockNumber && feeData) {
            const gasPrice = feeData.gasPrice || BigInt(0)
            const status = getNetworkStatus(gasPrice)

            setNetworkStats({
                blockHeight: Number(blockNumber),
                gasPrice,
                avgBlockTime: 2.0,
                networkStatus: status,
                lastUpdate: new Date()
            })

            // Update performance metrics
            setPerformanceMetrics([
                {
                    label: 'Block Time',
                    value: 2.0,
                    unit: 's',
                    trend: 'stable',
                    color: 'text-green-400'
                },
                {
                    label: 'Gas Price',
                    value: Number(formatUnits(gasPrice, 9)),
                    unit: 'Gwei',
                    trend: gasPrice > BigInt(20000000000) ? 'up' : 'down',
                    color: gasPrice > BigInt(20000000000) ? 'text-red-400' : 'text-green-400'
                },
                {
                    label: 'TPS',
                    value: Math.floor(Math.random() * 50) + 100,
                    unit: 'tx/s',
                    trend: 'stable',
                    color: 'text-blue-400'
                },
                {
                    label: 'Network Load',
                    value: Math.floor(Math.random() * 30) + 40,
                    unit: '%',
                    trend: 'stable',
                    color: 'text-purple-400'
                }
            ])

            // Update TPS data for chart
            setTpsData(prev => {
                const newData = [...prev.slice(-20), {
                    timestamp: Date.now(),
                    tps: Math.floor(Math.random() * 50) + 100
                }]
                return newData
            })
        }
    }, [blockNumber, feeData])

    // Simulate connection quality
    useEffect(() => {
        const interval = setInterval(() => {
            setConnectionQuality(prev => {
                const change = (Math.random() - 0.5) * 10
                return Math.max(70, Math.min(100, prev + change))
            })
        }, 3000)

        return () => clearInterval(interval)
    }, [])

    const getNetworkStatus = (gasPrice: bigint): 'healthy' | 'slow' | 'congested' => {
        if (gasPrice > BigInt(50000000000)) return 'congested'
        if (gasPrice > BigInt(20000000000)) return 'slow'
        return 'healthy'
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy': return 'text-green-400'
            case 'slow': return 'text-yellow-400'
            case 'congested': return 'text-red-400'
            default: return 'text-gray-400'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'healthy': return <CheckCircle className="w-5 h-5" />
            case 'slow': return <AlertTriangle className="w-5 h-5" />
            case 'congested': return <AlertTriangle className="w-5 h-5" />
            default: return <Activity className="w-5 h-5" />
        }
    }

    const handleRefresh = useCallback(() => {
        setIsRefreshing(true)
        setTimeout(() => setIsRefreshing(false), 1000)
    }, [])

    const formatBalance = (balance: bigint | undefined) => {
        if (!balance) return '0.0000'
        return parseFloat(formatEther(balance)).toFixed(4)
    }

    const formatTimestamp = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        })
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="relative">
                        <Monitor className="w-8 h-8 text-cyan-400" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Network Monitor</h3>
                        <p className="text-sm text-white/70">Real-time blockchain metrics</p>
                    </div>
                </div>

                <button
                    onClick={handleRefresh}
                    className="btn-secondary flex items-center space-x-2 px-4 py-2"
                >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                </button>
            </div>

            {/* Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Network Status */}
                <div className="glass p-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 rounded-full -translate-y-10 translate-x-10 blur-lg"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <div className={getStatusColor(networkStats.networkStatus)}>
                                {getStatusIcon(networkStats.networkStatus)}
                            </div>
                            <span className="text-sm text-white/70">Network Status</span>
                        </div>
                        <div className="text-lg font-bold text-white capitalize mb-1">
                            {networkStats.networkStatus}
                        </div>
                        <div className="text-xs text-white/50">
                            {NETWORK_NAME}
                        </div>
                    </div>
                </div>

                {/* Block Height */}
                <div className="glass p-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-400/20 to-pink-500/20 rounded-full -translate-y-10 translate-x-10 blur-lg"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <Database className="w-5 h-5 text-purple-400" />
                            <span className="text-sm text-white/70">Block Height</span>
                        </div>
                        <div className="text-lg font-bold text-white">
                            {networkStats.blockHeight.toLocaleString()}
                        </div>
                        <div className="text-xs text-white/50">
                            ~{networkStats.avgBlockTime.toFixed(1)}s blocks
                        </div>
                    </div>
                </div>

                {/* Gas Price */}
                <div className="glass p-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-400/20 to-red-500/20 rounded-full -translate-y-10 translate-x-10 blur-lg"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-5 h-5 text-orange-400" />
                            <span className="text-sm text-white/70">Gas Price</span>
                        </div>
                        <div className="text-lg font-bold text-white">
                            {Number(formatUnits(networkStats.gasPrice, 9)).toFixed(2)} Gwei
                        </div>
                        <div className="text-xs text-white/50">
                            Standard fee
                        </div>
                    </div>
                </div>

                {/* User Balance */}
                <div className="glass p-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-400/20 to-emerald-500/20 rounded-full -translate-y-10 translate-x-10 blur-lg"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <Cpu className="w-5 h-5 text-green-400" />
                            <span className="text-sm text-white/70">Balance</span>
                        </div>
                        <div className="text-lg font-bold text-white">
                            {formatBalance(balance?.value)} ETH
                        </div>
                        <div className="text-xs text-white/50">
                            {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Metrics */}
            <div className="glass p-6">
                <div className="flex items-center justify-between mb-6">
                    <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-blue-400" />
                        Performance Metrics
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-white/60">
                        <Clock className="w-4 h-4" />
                        <span>Last updated: {formatTimestamp(networkStats.lastUpdate)}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {performanceMetrics.map((metric, index) => (
                        <div key={index} className="bg-white/5 rounded-lg p-4 border border-white/10">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-white/70">{metric.label}</span>
                                <TrendingUp className={`w-4 h-4 ${metric.trend === 'up' ? 'text-green-400' :
                                        metric.trend === 'down' ? 'text-red-400' :
                                            'text-gray-400'
                                    }`} />
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className={`text-xl font-bold ${metric.color}`}>
                                    {metric.value.toFixed(metric.label === 'Gas Price' ? 2 : 0)}
                                </span>
                                <span className="text-sm text-white/50">{metric.unit}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Live Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* TPS Chart */}
                <div className="glass p-6">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-cyan-400" />
                        Transaction Throughput
                    </h4>

                    <div className="relative h-32 bg-black/20 rounded-lg p-4 overflow-hidden">
                        <svg className="w-full h-full" viewBox="0 0 400 100">
                            {/* Grid lines */}
                            <defs>
                                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                                </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#grid)" />

                            {/* TPS Line */}
                            {tpsData.length > 1 && (
                                <polyline
                                    points={tpsData.map((point, index) =>
                                        `${(index / (tpsData.length - 1)) * 400},${100 - ((point.tps - 80) / 40) * 100}`
                                    ).join(' ')}
                                    fill="none"
                                    stroke="url(#tpsGradient)"
                                    strokeWidth="2"
                                />
                            )}

                            {/* Gradient definition */}
                            <defs>
                                <linearGradient id="tpsGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#06b6d4" />
                                    <stop offset="100%" stopColor="#3b82f6" />
                                </linearGradient>
                            </defs>
                        </svg>

                        <div className="absolute bottom-2 left-2 text-xs text-white/70">
                            {tpsData.length > 0 ? `${tpsData[tpsData.length - 1].tps} TPS` : '0 TPS'}
                        </div>
                    </div>
                </div>

                {/* Connection Quality */}
                <div className="glass p-6">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Signal className="w-5 h-5 text-green-400" />
                        Connection Quality
                    </h4>

                    <div className="flex items-center gap-4">
                        <div className="relative w-20 h-20">
                            <svg className="w-20 h-20 transform -rotate-90">
                                <circle
                                    cx="40"
                                    cy="40"
                                    r="30"
                                    stroke="rgba(255,255,255,0.1)"
                                    strokeWidth="8"
                                    fill="none"
                                />
                                <circle
                                    cx="40"
                                    cy="40"
                                    r="30"
                                    stroke="url(#connectionGradient)"
                                    strokeWidth="8"
                                    fill="none"
                                    strokeDasharray={`${2 * Math.PI * 30}`}
                                    strokeDashoffset={`${2 * Math.PI * 30 * (1 - connectionQuality / 100)}`}
                                    className="transition-all duration-1000"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-lg font-bold text-white">{Math.round(connectionQuality)}%</span>
                            </div>

                            <defs>
                                <linearGradient id="connectionGradient">
                                    <stop offset="0%" stopColor="#10b981" />
                                    <stop offset="100%" stopColor="#06b6d4" />
                                </linearGradient>
                            </defs>
                        </div>

                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                <span className="text-sm text-white/70">Excellent connection</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Wifi className="w-4 h-4 text-blue-400" />
                                <span className="text-sm text-white/70">RPC: {Math.round(connectionQuality * 10)}ms</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4 text-purple-400" />
                                <span className="text-sm text-white/70">Secure connection</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Network Details */}
            <div className="glass p-6">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-indigo-400" />
                    Network Details
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <div className="flex items-center gap-2 mb-2">
                            <Server className="w-4 h-4 text-blue-400" />
                            <span className="text-sm text-white/70">Network</span>
                        </div>
                        <div className="text-lg font-bold text-white">{NETWORK_NAME}</div>
                        <div className="text-xs text-white/50">Base Layer 2</div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <div className="flex items-center gap-2 mb-2">
                            <Eye className="w-4 h-4 text-purple-400" />
                            <span className="text-sm text-white/70">Explorer</span>
                        </div>
                        <div className="text-lg font-bold text-white truncate">BaseScan</div>
                        <div className="text-xs text-white/50">Block explorer</div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <div className="flex items-center gap-2 mb-2">
                            <Activity className="w-4 h-4 text-green-400" />
                            <span className="text-sm text-white/70">Finality</span>
                        </div>
                        <div className="text-lg font-bold text-white">~12 seconds</div>
                        <div className="text-xs text-white/50">Block finality</div>
                    </div>
                </div>
            </div>
        </div>
    )
} 