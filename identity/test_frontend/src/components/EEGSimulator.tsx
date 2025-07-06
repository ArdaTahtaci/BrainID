'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Brain,
  Play,
  Pause,
  CheckCircle,
  Activity,
  Zap,
  Eye,
  Waves,
  Cpu,
  BarChart3,
  TrendingUp,
  Signal,
  Sparkles
} from 'lucide-react'

interface EEGData {
  timestamp: number
  alpha: number
  beta: number
  gamma: number
  theta: number
  delta: number
}

type Phase = 'ready' | 'recording' | 'processing' | 'complete'

export default function EEGSimulator({ onComplete }: { onComplete: () => void }) {
  const [currentPhase, setCurrentPhase] = useState<Phase>('ready')
  const [progress, setProgress] = useState(0)
  const [eegData, setEegData] = useState<EEGData[]>([])
  const [currentReading, setCurrentReading] = useState<EEGData | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [brainActivity, setBrainActivity] = useState({
    focus: 0,
    relaxation: 0,
    creativity: 0,
    stress: 0
  })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  // Generate realistic EEG data
  const generateEEGData = (timestamp: number): EEGData => {
    const baseFreq = 0.1
    const time = timestamp / 1000

    return {
      timestamp,
      alpha: 8 + 4 * Math.sin(time * baseFreq * 2) + Math.random() * 2,
      beta: 15 + 8 * Math.sin(time * baseFreq * 3) + Math.random() * 3,
      gamma: 30 + 10 * Math.sin(time * baseFreq * 5) + Math.random() * 4,
      theta: 6 + 3 * Math.sin(time * baseFreq * 1.5) + Math.random() * 1.5,
      delta: 2 + 1 * Math.sin(time * baseFreq) + Math.random() * 0.5
    }
  }

  // Update brain activity metrics
  const updateBrainActivity = (data: EEGData) => {
    setBrainActivity({
      focus: Math.min(100, Math.max(0, (data.beta / 25) * 100)),
      relaxation: Math.min(100, Math.max(0, (data.alpha / 15) * 100)),
      creativity: Math.min(100, Math.max(0, (data.theta / 10) * 100)),
      stress: Math.min(100, Math.max(0, (data.gamma / 40) * 100))
    })
  }

  // Draw EEG waves on canvas
  const drawEEGWaves = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (eegData.length < 2) return

    const waveHeight = canvas.height / 5
    const waveTypes = ['alpha', 'beta', 'gamma', 'theta', 'delta']
    const colors = ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b']

    waveTypes.forEach((waveType, index) => {
      const y = (index + 0.5) * waveHeight

      ctx.strokeStyle = colors[index]
      ctx.lineWidth = 2
      ctx.globalAlpha = 0.8
      ctx.beginPath()

      eegData.forEach((data, i) => {
        const x = (i / eegData.length) * canvas.width
        const value = data[waveType as keyof EEGData] as number
        const waveY = y + Math.sin(value * 0.1) * (waveHeight * 0.3)

        if (i === 0) {
          ctx.moveTo(x, waveY)
        } else {
          ctx.lineTo(x, waveY)
        }
      })

      ctx.stroke()
    })

    // Add glow effect
    ctx.shadowBlur = 10
    ctx.shadowColor = colors[Math.floor(Math.random() * colors.length)]
  }

  // Animation loop
  useEffect(() => {
    if (isRecording) {
      const animate = () => {
        drawEEGWaves()
        animationRef.current = requestAnimationFrame(animate)
      }
      animate()
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isRecording, eegData])

  // Recording timer
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [isRecording])

  const startRecording = () => {
    setCurrentPhase('recording')
    setIsRecording(true)
    setProgress(0)
    setEegData([])
    setRecordingTime(0)

    // Simulate data collection
    const dataInterval = setInterval(() => {
      const timestamp = Date.now()
      const newData = generateEEGData(timestamp)

      setEegData(prev => [...prev.slice(-100), newData])
      setCurrentReading(newData)
      updateBrainActivity(newData)

      setProgress(prev => {
        const newProgress = prev + 2
        if (newProgress >= 100) {
          clearInterval(dataInterval)
          setIsRecording(false)
          setCurrentPhase('processing')
          setTimeout(() => {
            setCurrentPhase('complete')
          }, 2000)
        }
        return newProgress
      })
    }, 100)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Enhanced Status Card */}
      <div className="glass p-8 relative overflow-hidden">
        {/* Background Animation */}
        <div className="absolute inset-0 opacity-10">
          <div className="neural-pulse absolute top-4 left-4 w-16 h-16 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full blur-lg"></div>
          <div className="neural-pulse absolute bottom-4 right-4 w-20 h-20 bg-gradient-to-r from-pink-400 to-orange-500 rounded-full blur-lg" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className={`relative p-4 rounded-2xl transition-all duration-500 ${currentPhase === 'recording' ? 'bg-red-500/20 border-red-400/50' :
                  currentPhase === 'processing' ? 'bg-yellow-500/20 border-yellow-400/50' :
                    currentPhase === 'complete' ? 'bg-green-500/20 border-green-400/50' :
                      'bg-cyan-500/20 border-cyan-400/50'
                } border-2`}>
                {currentPhase === 'complete' ? (
                  <CheckCircle className="h-8 w-8 text-green-400" />
                ) : (
                  <Brain className={`h-8 w-8 ${currentPhase === 'recording' ? 'text-red-400 brain-wave' :
                      currentPhase === 'processing' ? 'text-yellow-400 neural-pulse' :
                        'text-cyan-400'
                    }`} />
                )}

                {/* Status indicator */}
                <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${currentPhase === 'recording' ? 'bg-red-500 animate-pulse' :
                    currentPhase === 'processing' ? 'bg-yellow-500 animate-pulse' :
                      currentPhase === 'complete' ? 'bg-green-500' :
                        'bg-gray-500'
                  }`}></div>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-white mb-1">
                  {currentPhase === 'ready' && 'Neural Interface Ready'}
                  {currentPhase === 'recording' && 'Recording Brain Signals'}
                  {currentPhase === 'processing' && 'Processing Neural Data'}
                  {currentPhase === 'complete' && 'Neural Pattern Captured'}
                </h3>
                <p className="text-white/70">
                  {currentPhase === 'ready' && 'Prepare for neural pattern analysis'}
                  {currentPhase === 'recording' && `Recording time: ${formatTime(recordingTime)}`}
                  {currentPhase === 'processing' && 'Analyzing unique brainwave signatures'}
                  {currentPhase === 'complete' && 'Identity features extracted successfully'}
                </p>
              </div>
            </div>

            {currentPhase === 'ready' && (
              <button
                onClick={startRecording}
                className="btn-primary flex items-center space-x-3 text-lg px-6 py-3 neural-glow"
              >
                <Play className="h-6 w-6" />
                <span>Begin Neural Scan</span>
                <Sparkles className="h-5 w-5" />
              </button>
            )}

            {currentPhase === 'recording' && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-red-400">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="font-mono text-lg">REC</span>
                </div>
                <div className="text-white/70 font-mono">
                  {formatTime(recordingTime)}
                </div>
              </div>
            )}

            {currentPhase === 'complete' && (
              <button
                onClick={onComplete}
                className="btn-success flex items-center space-x-3 text-lg px-6 py-3"
              >
                <CheckCircle className="h-6 w-6" />
                <span>Continue to Verification</span>
              </button>
            )}
          </div>

          {/* Enhanced Progress Bar */}
          {(currentPhase === 'recording' || currentPhase === 'processing') && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-white/80">
                  {currentPhase === 'recording' ? 'Neural Pattern Capture' : 'Data Processing'}
                </span>
                <span className="text-sm text-white/60">{Math.round(progress)}%</span>
              </div>
              <div className="progress-bar h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="progress-fill h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* EEG Visualization */}
      {(currentPhase === 'recording' || currentPhase === 'processing' || currentPhase === 'complete') && (
        <div className="glass p-8">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-xl font-semibold text-white flex items-center space-x-2">
              <Activity className="h-6 w-6 text-cyan-400" />
              <span>Live EEG Visualization</span>
            </h4>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Signal className="h-4 w-4 text-green-400" />
                <span className="text-sm text-white/70">Signal Quality: Strong</span>
              </div>
              <div className="flex items-center space-x-2">
                <Waves className="h-4 w-4 text-blue-400" />
                <span className="text-sm text-white/70">Frequency: 50Hz</span>
              </div>
            </div>
          </div>

          {/* Canvas for EEG waves */}
          <div className="relative bg-black/20 rounded-xl p-4 mb-6">
            <canvas
              ref={canvasRef}
              className="w-full h-64 rounded-lg"
              style={{ background: 'linear-gradient(45deg, rgba(0,0,0,0.1), rgba(59,130,246,0.1))' }}
            />

            {/* Wave labels */}
            <div className="absolute left-2 top-4 space-y-6 text-xs">
              {['Alpha', 'Beta', 'Gamma', 'Theta', 'Delta'].map((wave, i) => (
                <div key={wave} className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'][i] }}
                  ></div>
                  <span className="text-white/70">{wave}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Real-time metrics */}
          {currentReading && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              {Object.entries(currentReading).filter(([key]) => key !== 'timestamp').map(([key, value]) => (
                <div key={key} className="bg-white/5 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-white">{(value as number).toFixed(1)}</div>
                  <div className="text-sm text-white/70 capitalize">{key} Hz</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Brain Activity Metrics */}
      {currentReading && (
        <div className="glass p-8">
          <h4 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
            <BarChart3 className="h-6 w-6 text-purple-400" />
            <span>Neural Activity Analysis</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(brainActivity).map(([activity, value]) => (
              <div key={activity} className="text-center">
                <div className="relative w-20 h-20 mx-auto mb-3">
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
                      stroke={
                        activity === 'focus' ? '#06b6d4' :
                          activity === 'relaxation' ? '#10b981' :
                            activity === 'creativity' ? '#8b5cf6' :
                              '#ef4444'
                      }
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 30}`}
                      strokeDashoffset={`${2 * Math.PI * 30 * (1 - value / 100)}`}
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-white">{Math.round(value)}</span>
                  </div>
                </div>
                <div className="text-white/80 capitalize font-medium">{activity}</div>
                <div className="text-sm text-white/60">
                  {value > 70 ? 'High' : value > 40 ? 'Medium' : 'Low'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Neural Pattern Summary */}
      {currentPhase === 'complete' && (
        <div className="glass p-8">
          <h4 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
            <Cpu className="h-6 w-6 text-green-400" />
            <span>Neural Pattern Summary</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl p-6 border border-cyan-400/30">
              <div className="flex items-center space-x-3 mb-3">
                <Eye className="h-6 w-6 text-cyan-400" />
                <span className="text-white font-medium">Pattern Uniqueness</span>
              </div>
              <div className="text-2xl font-bold text-white mb-2">98.7%</div>
              <div className="text-sm text-white/70">Highly distinctive neural signature</div>
            </div>

            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-purple-400/30">
              <div className="flex items-center space-x-3 mb-3">
                <Zap className="h-6 w-6 text-purple-400" />
                <span className="text-white font-medium">Signal Strength</span>
              </div>
              <div className="text-2xl font-bold text-white mb-2">94.2%</div>
              <div className="text-sm text-white/70">Excellent signal quality</div>
            </div>

            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-6 border border-green-400/30">
              <div className="flex items-center space-x-3 mb-3">
                <TrendingUp className="h-6 w-6 text-green-400" />
                <span className="text-white font-medium">Data Points</span>
              </div>
              <div className="text-2xl font-bold text-white mb-2">2,847</div>
              <div className="text-sm text-white/70">Neural features extracted</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 