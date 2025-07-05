'use client'

import { useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { Brain, Shield, Zap, Users, ArrowRight, Activity } from 'lucide-react'
import EEGSimulator from '@/components/EEGSimulator'
import VerificationFlow from '@/components/VerificationFlow'

export default function HomePage() {
  const { isConnected } = useAccount()
  const [currentStep, setCurrentStep] = useState<'intro' | 'eeg' | 'verify'>('intro')

  return (
    <div className="min-h-screen pwa-safe-area">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-primary-600" />
              <h1 className="text-xl font-bold text-gray-900">EEG Verifier</h1>
            </div>
            <ConnectButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentStep === 'intro' && (
          <IntroSection onNext={() => setCurrentStep('eeg')} isConnected={isConnected} />
        )}
        
        {currentStep === 'eeg' && (
          <EEGSection onNext={() => setCurrentStep('verify')} />
        )}
        
        {currentStep === 'verify' && (
          <VerifySection onBack={() => setCurrentStep('eeg')} />
        )}
      </main>
    </div>
  )
}

function IntroSection({ onNext, isConnected }: { onNext: () => void, isConnected: boolean }) {
  return (
    <div className="text-center space-y-12">
      {/* Hero */}
      <div className="space-y-6">
        <h2 className="text-4xl md:text-6xl font-bold text-gray-900">
          Secure Identity with
          <span className="text-primary-600 block">Your Brainwaves</span>
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Revolutionary EEG-based identity verification using zero-knowledge proofs. 
          Your thoughts are your password.
        </p>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-8">
        <FeatureCard
          icon={<Brain className="h-8 w-8" />}
          title="EEG Analysis"
          description="Advanced brainwave pattern recognition"
          color="text-eeg-alpha"
        />
        <FeatureCard
          icon={<Shield className="h-8 w-8" />}
          title="Zero-Knowledge"
          description="Privacy-preserving identity proofs"
          color="text-primary-600"
        />
        <FeatureCard
          icon={<Zap className="h-8 w-8" />}
          title="Instant Verify"
          description="Real-time verification on blockchain"
          color="text-eeg-gamma"
        />
      </div>

      {/* CTA */}
      <div className="space-y-4">
        {!isConnected ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">Please connect your wallet to continue</p>
          </div>
        ) : (
          <button
            onClick={onNext}
            className="btn-primary text-lg px-8 py-3 inline-flex items-center space-x-2 neural-glow"
          >
            <span>Start Verification</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  )
}

function EEGSection({ onNext }: { onNext: () => void }) {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">EEG Brainwave Capture</h2>
        <p className="text-gray-600">Simulating EEG data capture and processing</p>
      </div>
      
      <EEGSimulator onComplete={onNext} />
    </div>
  )
}

function VerifySection({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Identity Verification</h2>
        <p className="text-gray-600">Generating zero-knowledge proof and verifying on-chain</p>
      </div>
      
      <VerificationFlow onBack={onBack} />
    </div>
  )
}

function FeatureCard({ icon, title, description, color }: {
  icon: React.ReactNode
  title: string
  description: string
  color: string
}) {
  return (
    <div className="card text-center space-y-4 hover:shadow-xl transition-shadow duration-300">
      <div className={`${color} mx-auto w-fit p-3 bg-gray-50 rounded-full`}>
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
} 