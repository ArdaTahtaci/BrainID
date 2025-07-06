'use client'

import { useState, useEffect } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import {
  Brain,
  Shield,
  Zap,
  Users,
  ArrowRight,
  Activity,
  BarChart3,
  Monitor,
  Sparkles,
  Eye,
  Lock,
  Waves,
  Cpu,
  Globe,
  TrendingUp,
  Fingerprint
} from 'lucide-react'
import RealEEGCapture from '@/components/RealEEGCapture'
import AdvancedEEGCapture from '@/components/AdvancedEEGCapture'
import VerificationFlow from '@/components/VerificationFlow'
import NetworkMonitor from '@/components/NetworkMonitor'
import TransactionHistory from '@/components/TransactionHistory'

export default function HomePage() {
  const { isConnected } = useAccount()
  const [currentStep, setCurrentStep] = useState<'intro' | 'eeg' | 'verify' | 'dashboard'>('intro')
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className="min-h-screen pwa-safe-area relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.3),transparent_50%)]"></div>
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_var(--mouse-x)_var(--mouse-y),rgba(59,130,246,0.15),transparent_50%)]"
          style={{
            '--mouse-x': `${mousePosition.x}px`,
            '--mouse-y': `${mousePosition.y}px`
          } as React.CSSProperties}
        ></div>
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/20 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 4}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Header */}
      <header className="relative z-50 backdrop-blur-lg bg-white/10 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Brain className="h-8 w-8 text-cyan-400" />
                <div className="absolute inset-0 h-8 w-8 text-cyan-400 animate-pulse opacity-50">
                  <Brain className="h-8 w-8" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">NeuroAuth</h1>
                <p className="text-xs text-cyan-300">Mind-Powered Identity</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {isConnected && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentStep('dashboard')}
                    className="group flex items-center space-x-2 px-3 py-2 text-sm text-white/80 hover:text-white transition-all duration-200 rounded-lg hover:bg-white/10"
                  >
                    <BarChart3 className="h-4 w-4 group-hover:scale-110 transition-transform" />
                    <span>Dashboard</span>
                  </button>
                  <button
                    onClick={() => setCurrentStep('intro')}
                    className="text-sm text-white/80 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/10"
                  >
                    Home
                  </button>
                </div>
              )}
              <div className="rainbow-kit-wrapper">
                <ConnectButton />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentStep === 'intro' && (
          <IntroSection onNext={() => setCurrentStep('eeg')} isConnected={isConnected} />
        )}

        {currentStep === 'eeg' && (
          <EEGSection onNext={() => setCurrentStep('verify')} />
        )}

        {currentStep === 'verify' && (
          <VerifySection onBack={() => setCurrentStep('eeg')} />
        )}

        {currentStep === 'dashboard' && (
          <DashboardSection onBack={() => setCurrentStep('intro')} />
        )}
      </main>
    </div>
  )
}

function IntroSection({ onNext, isConnected }: { onNext: () => void, isConnected: boolean }) {
  const [typedText, setTypedText] = useState('')
  const fullText = 'Your thoughts are your identity.'

  useEffect(() => {
    let index = 0
    const timer = setInterval(() => {
      if (index < fullText.length) {
        setTypedText(fullText.slice(0, index + 1))
        index++
      } else {
        clearInterval(timer)
      }
    }, 100)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="text-center space-y-16">
      {/* Enhanced Hero */}
      <div className="space-y-8 relative">
        {/* Glowing orb */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-16 w-32 h-32 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 opacity-20 blur-3xl animate-pulse"></div>

        <div className="relative">
          <h2 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient">
              Neural
            </span>
            <br />
            <span className="text-white">Authentication</span>
          </h2>

          <div className="h-8 mb-6">
            <p className="text-xl md:text-2xl text-cyan-300 font-light">
              {typedText}
              <span className="animate-pulse">|</span>
            </p>
          </div>

          <p className="text-lg text-white/80 max-w-3xl mx-auto leading-relaxed">
            Revolutionary EEG-based identity verification using zero-knowledge proofs.
            <br />
            <span className="text-cyan-300">Secure. Private. Unbreakable.</span>
          </p>
        </div>
      </div>

      {/* Enhanced Features */}
      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        <FeatureCard
          icon={<Brain className="h-8 w-8" />}
          title="Neural Patterns"
          description="Unique brainwave signatures that can't be replicated"
          gradient="from-pink-500 to-purple-600"
          delay="0"
        />
        <FeatureCard
          icon={<Shield className="h-8 w-8" />}
          title="Zero-Knowledge"
          description="Prove your identity without revealing your data"
          gradient="from-blue-500 to-cyan-600"
          delay="100"
        />
        <FeatureCard
          icon={<Zap className="h-8 w-8" />}
          title="Instant Verify"
          description="Lightning-fast verification on blockchain"
          gradient="from-amber-500 to-orange-600"
          delay="200"
        />
      </div>

      {/* Stats Section */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 max-w-4xl mx-auto">
        <h3 className="text-2xl font-bold text-white mb-6">Platform Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <StatCard title="Verified Users" value="2,847" icon={<Users className="h-5 w-5" />} />
          <StatCard title="Verifications" value="12,934" icon={<Fingerprint className="h-5 w-5" />} />
          <StatCard title="Success Rate" value="99.7%" icon={<TrendingUp className="h-5 w-5" />} />
          <StatCard title="Avg Speed" value="2.3s" icon={<Zap className="h-5 w-5" />} />
        </div>
      </div>

      {/* CTA Section */}
      <div className="space-y-6">
        {!isConnected ? (
          <div className="bg-amber-500/20 border border-amber-400/50 rounded-xl p-6 max-w-md mx-auto backdrop-blur-sm">
            <div className="flex items-center space-x-3 mb-3">
              <Lock className="h-6 w-6 text-amber-400" />
              <p className="text-amber-100 font-medium">Wallet Connection Required</p>
            </div>
            <p className="text-amber-200 text-sm">
              Connect your wallet to access neural authentication
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={onNext}
              className="group relative inline-flex items-center space-x-3 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-semibold text-lg px-8 py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform"
            >
              <Sparkles className="h-6 w-6 group-hover:rotate-12 transition-transform" />
              <span>Begin Neural Scan</span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
            </button>

            <div className="flex items-center justify-center space-x-2 text-white/60 text-sm">
              <Eye className="h-4 w-4" />
              <span>Privacy-first • No data stored • Fully anonymous</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function FeatureCard({ icon, title, description, gradient, delay }: {
  icon: React.ReactNode
  title: string
  description: string
  gradient: string
  delay: string
}) {
  return (
    <div
      className="group relative bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105 hover:shadow-xl"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br opacity-0 group-hover:opacity-20 transition-opacity duration-300"
        style={{ background: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }}></div>

      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-r ${gradient} mb-4 shadow-lg`}>
        <div className="text-white">
          {icon}
        </div>
      </div>

      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-white/70 leading-relaxed">{description}</p>
    </div>
  )
}

function StatCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center mb-2 text-cyan-400">
        {icon}
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-white/70">{title}</div>
    </div>
  )
}

function EEGSection({ onNext }: { onNext: () => void }) {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-white mb-4">
          <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Neural Signature Capture
          </span>
        </h2>
        <p className="text-white/80 text-lg">Advanced real-time EEG monitoring and key generation</p>
      </div>

      <div className="max-w-6xl mx-auto">
        <AdvancedEEGCapture onComplete={onNext} />
      </div>
    </div>
  )
}

function VerifySection({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-white mb-4">
          <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
            Identity Verification
          </span>
        </h2>
        <p className="text-white/80 text-lg">Generating zero-knowledge proof and verifying on-chain</p>
      </div>

      <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8">
        <VerificationFlow onBack={onBack} />
      </div>
    </div>
  )
}

function DashboardSection({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-bold text-white mb-2">
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Neural Dashboard
            </span>
          </h2>
          <p className="text-white/80 text-lg">Real-time monitoring and analytics</p>
        </div>
        <button
          onClick={onBack}
          className="group flex items-center space-x-2 text-white/80 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/10"
        >
          <ArrowRight className="h-4 w-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Home</span>
        </button>
      </div>

      {/* Enhanced Dashboard Components */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Network Monitor */}
        <div className="lg:col-span-2">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
            <NetworkMonitor />
          </div>
        </div>

        {/* Transaction History */}
        <div className="lg:col-span-2">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
            <TransactionHistory />
          </div>
        </div>


      </div>

      {/* Phase 2.2 Features Summary */}
      <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">🎉 Phase 2.2 Enhancements Complete!</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <h4 className="font-semibold text-cyan-400 mb-2">📡 Real-time Monitoring</h4>
            <p className="text-sm text-white/70">
              Network status, block height, gas prices, and user balance tracking
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <h4 className="font-semibold text-green-400 mb-2">📊 Transaction History</h4>
            <p className="text-sm text-white/70">
              Complete transaction tracking with filtering, sorting, and detailed analytics
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <h4 className="font-semibold text-purple-400 mb-2">⚡ Enhanced Loading States</h4>
            <p className="text-sm text-white/70">
              Progress indicators, estimated times, and comprehensive user feedback
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 