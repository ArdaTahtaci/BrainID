'use client'

import React, { useState, useEffect } from 'react'
import {
    Clock,
    ExternalLink,
    CheckCircle,
    XCircle,
    AlertTriangle,
    TrendingUp,
    Filter,
    Search,
    Download,
    RefreshCw,
    Eye,
    Hash,
    Zap,
    Activity,
    BarChart3,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Layers,
    Target
} from 'lucide-react'
import { formatEther, formatUnits } from 'viem'
import { EXPLORER_URL } from '../contracts/addresses'

interface Transaction {
    id: string
    hash: string
    type: 'identity_registration' | 'group_creation' | 'member_addition' | 'proof_verification' | 'other'
    status: 'pending' | 'confirmed' | 'failed'
    timestamp: Date
    blockNumber?: number
    gasUsed?: bigint
    gasPrice?: bigint
    value?: bigint
    from: string
    to?: string
    description: string
    estimatedTime?: number
    confirmations?: number
}

type FilterType = 'all' | 'pending' | 'confirmed' | 'failed'
type TransactionType = 'all' | 'identity_registration' | 'group_creation' | 'member_addition' | 'proof_verification' | 'other'

export default function TransactionHistory() {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
    const [filterStatus, setFilterStatus] = useState<FilterType>('all')
    const [filterType, setFilterType] = useState<TransactionType>('all')
    const [searchTerm, setSearchTerm] = useState('')
    const [sortBy, setSortBy] = useState<'timestamp' | 'gasUsed' | 'value'>('timestamp')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
    const [isLoading, setIsLoading] = useState(false)
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)

    // Mock transaction data
    useEffect(() => {
        const mockTransactions: Transaction[] = [
            {
                id: '1',
                hash: '0x7d5c4e1f9a8b3c2d6e4f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e',
                type: 'identity_registration',
                status: 'confirmed',
                timestamp: new Date(Date.now() - 1000 * 60 * 15),
                blockNumber: 5847392,
                gasUsed: BigInt(125000),
                gasPrice: BigInt(25000000000),
                value: BigInt(0),
                from: '0x742d35Cc6634C0532925a3b8D2D7D4C5D6E7F8A9',
                to: '0x3189609743695911c270b2e053A589F9b742a9bf',
                description: 'EEG Identity Registration',
                confirmations: 12
            },
            {
                id: '2',
                hash: '0x8e6d5f2a0b9c4d3e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f',
                type: 'group_creation',
                status: 'confirmed',
                timestamp: new Date(Date.now() - 1000 * 60 * 45),
                blockNumber: 5847301,
                gasUsed: BigInt(89000),
                gasPrice: BigInt(23000000000),
                value: BigInt(0),
                from: '0x742d35Cc6634C0532925a3b8D2D7D4C5D6E7F8A9',
                to: '0x43D4c18Ba577999F5d1226B60b9835F155517ab3',
                description: 'Create Verification Group',
                confirmations: 23
            },
            {
                id: '3',
                hash: '0x9f7e6d5c4b3a2918e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f',
                type: 'member_addition',
                status: 'pending',
                timestamp: new Date(Date.now() - 1000 * 60 * 2),
                gasUsed: BigInt(67000),
                gasPrice: BigInt(27000000000),
                value: BigInt(0),
                from: '0x742d35Cc6634C0532925a3b8D2D7D4C5D6E7F8A9',
                to: '0x43D4c18Ba577999F5d1226B60b9835F155517ab3',
                description: 'Add Member to Group',
                estimatedTime: 30
            },
            {
                id: '4',
                hash: '0xa0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d',
                type: 'proof_verification',
                status: 'failed',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
                blockNumber: 5847102,
                gasUsed: BigInt(0),
                gasPrice: BigInt(25000000000),
                value: BigInt(0),
                from: '0x742d35Cc6634C0532925a3b8D2D7D4C5D6E7F8A9',
                to: '0xd4FaeD55603c2dBF43B41b67b6e78AeCd059AD9c',
                description: 'Zero-Knowledge Proof Verification',
                confirmations: 0
            }
        ]
        setTransactions(mockTransactions)
    }, [])

    // Filter and sort transactions
    useEffect(() => {
        let filtered = transactions

        // Filter by status
        if (filterStatus !== 'all') {
            filtered = filtered.filter(tx => tx.status === filterStatus)
        }

        // Filter by type
        if (filterType !== 'all') {
            filtered = filtered.filter(tx => tx.type === filterType)
        }

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(tx =>
                tx.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
                tx.description.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        // Sort transactions
        filtered.sort((a, b) => {
            let aValue: number, bValue: number

            switch (sortBy) {
                case 'timestamp':
                    aValue = a.timestamp.getTime()
                    bValue = b.timestamp.getTime()
                    break
                case 'gasUsed':
                    aValue = Number(a.gasUsed || 0)
                    bValue = Number(b.gasUsed || 0)
                    break
                case 'value':
                    aValue = Number(a.value || 0)
                    bValue = Number(b.value || 0)
                    break
                default:
                    aValue = a.timestamp.getTime()
                    bValue = b.timestamp.getTime()
            }

            return sortOrder === 'desc' ? bValue - aValue : aValue - bValue
        })

        setFilteredTransactions(filtered)
    }, [transactions, filterStatus, filterType, searchTerm, sortBy, sortOrder])

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'confirmed':
                return <CheckCircle className="w-4 h-4 text-green-400" />
            case 'failed':
                return <XCircle className="w-4 h-4 text-red-400" />
            case 'pending':
                return <AlertTriangle className="w-4 h-4 text-yellow-400 animate-pulse" />
            default:
                return <Clock className="w-4 h-4 text-gray-400" />
        }
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'identity_registration':
                return <Target className="w-4 h-4 text-cyan-400" />
            case 'group_creation':
                return <Layers className="w-4 h-4 text-purple-400" />
            case 'member_addition':
                return <ArrowUpRight className="w-4 h-4 text-blue-400" />
            case 'proof_verification':
                return <Eye className="w-4 h-4 text-green-400" />
            default:
                return <Hash className="w-4 h-4 text-gray-400" />
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'bg-green-500/20 text-green-400 border-green-400/30'
            case 'failed': return 'bg-red-500/20 text-red-400 border-red-400/30'
            case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30'
            default: return 'bg-gray-500/20 text-gray-400 border-gray-400/30'
        }
    }

    const formatGas = (gasUsed: bigint | undefined, gasPrice: bigint | undefined) => {
        if (!gasUsed || !gasPrice) return 'N/A'
        const totalGas = gasUsed * gasPrice
        return `${formatEther(totalGas)} ETH`
    }

    const formatTimeAgo = (timestamp: Date) => {
        const now = new Date()
        const diff = now.getTime() - timestamp.getTime()
        const minutes = Math.floor(diff / 60000)
        const hours = Math.floor(minutes / 60)
        const days = Math.floor(hours / 24)

        if (days > 0) return `${days}d ago`
        if (hours > 0) return `${hours}h ago`
        if (minutes > 0) return `${minutes}m ago`
        return 'Just now'
    }

    const refreshData = () => {
        setIsLoading(true)
        setTimeout(() => setIsLoading(false), 1000)
    }

    const exportData = () => {
        const csvContent = "data:text/csv;charset=utf-8," +
            "Hash,Type,Status,Timestamp,Gas Used,Gas Price,Value\n" +
            filteredTransactions.map(tx =>
                `${tx.hash},${tx.type},${tx.status},${tx.timestamp.toISOString()},${tx.gasUsed || 0},${tx.gasPrice || 0},${tx.value || 0}`
            ).join("\n")

        const encodedUri = encodeURI(csvContent)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", "transaction_history.csv")
        link.click()
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="flex items-center space-x-3">
                    <div className="relative">
                        <Activity className="w-8 h-8 text-purple-400" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Transaction History</h3>
                        <p className="text-sm text-white/70">
                            {filteredTransactions.length} of {transactions.length} transactions
                        </p>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <button
                        onClick={refreshData}
                        className="btn-secondary flex items-center space-x-2 px-3 py-2"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                    </button>
                    <button
                        onClick={exportData}
                        className="btn-secondary flex items-center space-x-2 px-3 py-2"
                    >
                        <Download className="w-4 h-4" />
                        <span>Export</span>
                    </button>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="glass p-4 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
                        <input
                            type="text"
                            placeholder="Search by hash or description..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-primary pl-10 w-full"
                        />
                    </div>

                    {/* Status Filter */}
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as FilterType)}
                        className="input-primary min-w-[140px]"
                    >
                        <option value="all">All Status</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="pending">Pending</option>
                        <option value="failed">Failed</option>
                    </select>

                    {/* Type Filter */}
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as TransactionType)}
                        className="input-primary min-w-[160px]"
                    >
                        <option value="all">All Types</option>
                        <option value="identity_registration">Identity Registration</option>
                        <option value="group_creation">Group Creation</option>
                        <option value="member_addition">Member Addition</option>
                        <option value="proof_verification">Proof Verification</option>
                    </select>
                </div>

                {/* Sort Options */}
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-white/70">Sort by:</span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as 'timestamp' | 'gasUsed' | 'value')}
                            className="input-primary text-sm px-3 py-1"
                        >
                            <option value="timestamp">Time</option>
                            <option value="gasUsed">Gas Used</option>
                            <option value="value">Value</option>
                        </select>
                    </div>
                    <button
                        onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                        className="btn-secondary px-3 py-1 text-sm flex items-center space-x-1"
                    >
                        {sortOrder === 'desc' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        <span>{sortOrder === 'desc' ? 'Desc' : 'Asc'}</span>
                    </button>
                </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="glass p-4">
                    <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <span className="text-sm text-white/70">Confirmed</span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                        {transactions.filter(tx => tx.status === 'confirmed').length}
                    </div>
                    <div className="text-xs text-white/50">
                        {Math.round((transactions.filter(tx => tx.status === 'confirmed').length / transactions.length) * 100)}% success rate
                    </div>
                </div>

                <div className="glass p-4">
                    <div className="flex items-center space-x-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-400" />
                        <span className="text-sm text-white/70">Pending</span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                        {transactions.filter(tx => tx.status === 'pending').length}
                    </div>
                    <div className="text-xs text-white/50">
                        Awaiting confirmation
                    </div>
                </div>

                <div className="glass p-4">
                    <div className="flex items-center space-x-2 mb-2">
                        <Zap className="w-5 h-5 text-blue-400" />
                        <span className="text-sm text-white/70">Total Gas</span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                        {(transactions.reduce((sum, tx) => sum + Number(tx.gasUsed || 0), 0) / 1000000).toFixed(2)}M
                    </div>
                    <div className="text-xs text-white/50">
                        Gas units used
                    </div>
                </div>

                <div className="glass p-4">
                    <div className="flex items-center space-x-2 mb-2">
                        <TrendingUp className="w-5 h-5 text-purple-400" />
                        <span className="text-sm text-white/70">Avg Time</span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                        2.3s
                    </div>
                    <div className="text-xs text-white/50">
                        Confirmation time
                    </div>
                </div>
            </div>

            {/* Transaction List */}
            <div className="glass p-6">
                <div className="space-y-4">
                    {filteredTransactions.length === 0 ? (
                        <div className="text-center py-12">
                            <Activity className="w-12 h-12 text-white/30 mx-auto mb-4" />
                            <p className="text-white/70">No transactions found</p>
                            <p className="text-sm text-white/50">Try adjusting your filters</p>
                        </div>
                    ) : (
                        filteredTransactions.map((tx) => (
                            <div
                                key={tx.id}
                                className="bg-white/5 hover:bg-white/10 rounded-lg p-4 border border-white/10 hover:border-white/20 transition-all duration-200 cursor-pointer"
                                onClick={() => setSelectedTx(tx)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="flex items-center space-x-2">
                                            {getTypeIcon(tx.type)}
                                            {getStatusIcon(tx.status)}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-2">
                                                <p className="font-medium text-white truncate">{tx.description}</p>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(tx.status)}`}>
                                                    {tx.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-4 mt-1">
                                                <p className="text-sm text-white/70 font-mono">
                                                    {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                                                </p>
                                                <span className="text-xs text-white/50">
                                                    {formatTimeAgo(tx.timestamp)}
                                                </span>
                                                {tx.blockNumber && (
                                                    <span className="text-xs text-white/50">
                                                        Block #{tx.blockNumber.toLocaleString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-4">
                                        <div className="text-right">
                                            <div className="text-sm font-medium text-white">
                                                {formatGas(tx.gasUsed, tx.gasPrice)}
                                            </div>
                                            <div className="text-xs text-white/50">
                                                {tx.gasUsed ? `${(Number(tx.gasUsed) / 1000).toFixed(0)}k gas` : 'N/A'}
                                            </div>
                                        </div>

                                        <a
                                            href={`${EXPLORER_URL}/tx/${tx.hash}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-cyan-400 hover:text-cyan-300 transition-colors"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    </div>
                                </div>

                                {tx.status === 'pending' && tx.estimatedTime && (
                                    <div className="mt-3 flex items-center space-x-2">
                                        <div className="w-full bg-white/10 rounded-full h-2">
                                            <div className="bg-yellow-400 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                                        </div>
                                        <span className="text-xs text-white/70 whitespace-nowrap">
                                            ~{tx.estimatedTime}s remaining
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Transaction Detail Modal */}
            {selectedTx && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="glass max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-white">Transaction Details</h3>
                                <button
                                    onClick={() => setSelectedTx(null)}
                                    className="text-white/70 hover:text-white transition-colors"
                                >
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm text-white/70">Status</label>
                                        <div className="flex items-center space-x-2 mt-1">
                                            {getStatusIcon(selectedTx.status)}
                                            <span className="text-white font-medium capitalize">{selectedTx.status}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm text-white/70">Type</label>
                                        <div className="flex items-center space-x-2 mt-1">
                                            {getTypeIcon(selectedTx.type)}
                                            <span className="text-white font-medium">{selectedTx.type.replace('_', ' ')}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm text-white/70">Hash</label>
                                    <div className="flex items-center space-x-2 mt-1">
                                        <code className="text-white font-mono bg-white/10 px-2 py-1 rounded text-sm flex-1">
                                            {selectedTx.hash}
                                        </code>
                                        <a
                                            href={`${EXPLORER_URL}/tx/${selectedTx.hash}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-cyan-400 hover:text-cyan-300 transition-colors"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm text-white/70">From</label>
                                        <code className="text-white font-mono bg-white/10 px-2 py-1 rounded text-sm mt-1 block">
                                            {selectedTx.from}
                                        </code>
                                    </div>
                                    {selectedTx.to && (
                                        <div>
                                            <label className="text-sm text-white/70">To</label>
                                            <code className="text-white font-mono bg-white/10 px-2 py-1 rounded text-sm mt-1 block">
                                                {selectedTx.to}
                                            </code>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-sm text-white/70">Gas Used</label>
                                        <div className="text-white font-medium mt-1">
                                            {selectedTx.gasUsed ? `${(Number(selectedTx.gasUsed) / 1000).toFixed(0)}k` : 'N/A'}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm text-white/70">Gas Price</label>
                                        <div className="text-white font-medium mt-1">
                                            {selectedTx.gasPrice ? `${formatUnits(selectedTx.gasPrice, 9)} Gwei` : 'N/A'}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm text-white/70">Total Fee</label>
                                        <div className="text-white font-medium mt-1">
                                            {formatGas(selectedTx.gasUsed, selectedTx.gasPrice)}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm text-white/70">Timestamp</label>
                                        <div className="text-white font-medium mt-1">
                                            {selectedTx.timestamp.toLocaleString()}
                                        </div>
                                    </div>
                                    {selectedTx.blockNumber && (
                                        <div>
                                            <label className="text-sm text-white/70">Block Number</label>
                                            <div className="text-white font-medium mt-1">
                                                #{selectedTx.blockNumber.toLocaleString()}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {selectedTx.confirmations && (
                                    <div>
                                        <label className="text-sm text-white/70">Confirmations</label>
                                        <div className="text-white font-medium mt-1">
                                            {selectedTx.confirmations}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
} 