'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts'
import { Activity, Brain, CheckCircle, Play, Pause } from 'lucide-react'

interface EEGData {
  time: number
  alpha: number
  beta: number
  gamma: number
  delta: number
  theta: number
}

export default function EEGSimulator({ onComplete }: { onComplete: () => void }) {
  const [isRecording, setIsRecording] = useState(false)
  const [progress, setProgress] = useState(0)
  const [eegData, setEegData] = useState<EEGData[]>([])
  const [currentPhase, setCurrentPhase] = useState<'ready' | 'recording' | 'processing' | 'complete'>('ready')

  // Simulate EEG data generation
  useEffect(() => {
    if (!isRecording) return

    const interval = setInterval(() => {
      const time = Date.now()
      const newData: EEGData = {
        time,
        alpha: Math.sin(time * 0.01) * 30 + Math.random() * 10,
        beta: Math.sin(time * 0.015) * 25 + Math.random() * 8,
        gamma: Math.sin(time * 0.02) * 20 + Math.random() * 6,
        delta: Math.sin(time * 0.005) * 40 + Math.random() * 12,
        theta: Math.sin(time * 0.008) * 35 + Math.random() * 9,
      }

      setEegData(prev => [...prev.slice(-50), newData])
      setProgress(prev => {
        const newProgress = prev + 2
        if (newProgress >= 100) {
          setIsRecording(false)
          setCurrentPhase('processing')
          setTimeout(() => {
            setCurrentPhase('complete')
          }, 2000)
        }
        return Math.min(newProgress, 100)
      })
    }, 100)

    return () => clearInterval(interval)
  }, [isRecording])

  const startRecording = () => {
    setIsRecording(true)
    setCurrentPhase('recording')
    setProgress(0)
    setEegData([])
  }

  const handleComplete = () => {
    onComplete()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Status Card */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${
              currentPhase === 'recording' ? 'bg-red-100 text-red-600' :
              currentPhase === 'processing' ? 'bg-yellow-100 text-yellow-600' :
              currentPhase === 'complete' ? 'bg-green-100 text-green-600' :
              'bg-gray-100 text-gray-600'
            }`}>
              {currentPhase === 'complete' ? <CheckCircle className="h-6 w-6" /> : <Brain className="h-6 w-6" />}
            </div>
            <div>
              <h3 className="text-lg font-semibold">
                {currentPhase === 'ready' && 'Ready to Record'}
                {currentPhase === 'recording' && 'Recording Brainwaves...'}
                {currentPhase === 'processing' && 'Processing EEG Data...'}
                {currentPhase === 'complete' && 'EEG Capture Complete'}
              </h3>
              <p className="text-gray-600 text-sm">
                {currentPhase === 'ready' && 'Click start to begin EEG simulation'}
                {currentPhase === 'recording' && 'Capturing your unique brainwave patterns'}
                {currentPhase === 'processing' && 'Analyzing neural signatures...'}
                {currentPhase === 'complete' && 'Identity features extracted successfully'}
              </p>
            </div>
          </div>
          
          {currentPhase === 'ready' && (
            <button onClick={startRecording} className="btn-primary flex items-center space-x-2">
              <Play className="h-4 w-4" />
              <span>Start Recording</span>
            </button>
          )}
        </div>

        {/* Progress Bar */}
        {(currentPhase === 'recording' || currentPhase === 'processing') && (
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* EEG Visualization */}
      {eegData.length > 0 && (
        <div className="card">
          <h4 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <Activity className="h-5 w-5 text-primary-600" />
            <span>Live EEG Signals</span>
          </h4>
          
          {/* Wave Bands */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <WaveBand name="Alpha" color="text-eeg-alpha" value={eegData[eegData.length - 1]?.alpha || 0} />
            <WaveBand name="Beta" color="text-eeg-beta" value={eegData[eegData.length - 1]?.beta || 0} />
            <WaveBand name="Gamma" color="text-eeg-gamma" value={eegData[eegData.length - 1]?.gamma || 0} />
            <WaveBand name="Delta" color="text-eeg-delta" value={eegData[eegData.length - 1]?.delta || 0} />
            <WaveBand name="Theta" color="text-eeg-theta" value={eegData[eegData.length - 1]?.theta || 0} />
          </div>

          {/* Chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={eegData}>
                <XAxis dataKey="time" hide />
                <YAxis hide />
                <Line type="monotone" dataKey="alpha" stroke="#22c55e" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="beta" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="gamma" stroke="#f59e0b" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="delta" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="theta" stroke="#ef4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Complete Action */}
      {currentPhase === 'complete' && (
        <div className="text-center">
          <button onClick={handleComplete} className="btn-primary text-lg px-8 py-3">
            Proceed to Verification
          </button>
        </div>
      )}
    </div>
  )
}

function WaveBand({ name, color, value }: { name: string, color: string, value: number }) {
  return (
    <div className="text-center">
      <div className={`text-sm font-medium ${color}`}>{name}</div>
      <div className="text-2xl font-bold text-gray-900">{value.toFixed(1)}</div>
      <div className="text-xs text-gray-500">μV</div>
    </div>
  )
} 