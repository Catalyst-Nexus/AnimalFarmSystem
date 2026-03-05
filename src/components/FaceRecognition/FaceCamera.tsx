import { useRef, useEffect, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Camera, RefreshCw, AlertCircle, Loader2 } from 'lucide-react'
import {
  loadFaceApiModels,
  areModelsLoaded,
  detectSingleFaceWithDescriptor,
  captureVideoFrame,
  validateFaceQuality,
} from '@/services/faceApiService'

export interface FaceCameraProps {
  onFaceDetected?: (descriptor: Float32Array, canvas: HTMLCanvasElement) => void
  onError?: (error: string) => void
  autoCapture?: boolean
  captureDelay?: number
  className?: string
  showOverlay?: boolean
  overlayMode?: 'detection' | 'registration' | 'login'
}

export const FaceCamera = ({
  onFaceDetected,
  onError,
  autoCapture = false,
  captureDelay = 2000,
  className,
  showOverlay = true,
  overlayMode = 'detection',
}: FaceCameraProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const captureTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [isCameraReady, setIsCameraReady] = useState(false)
  const [isDetecting, setIsDetecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [faceDetected, setFaceDetected] = useState(false)
  const [detectionMessage, setDetectionMessage] = useState<string>('')

  // Initialize camera and load models
  const initializeCamera = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Load face-api models
      const modelsReady = await loadFaceApiModels()
      if (!modelsReady) {
        throw new Error('Failed to load face recognition models')
      }

      // Get camera stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        
        // Wait for video to be ready
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play()
              resolve()
            }
          }
        })

        setIsCameraReady(true)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to initialize camera'
      setError(message)
      onError?.(message)
    } finally {
      setIsLoading(false)
    }
  }, [onError])

  // Cleanup camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (captureTimeoutRef.current) {
      clearTimeout(captureTimeoutRef.current)
      captureTimeoutRef.current = null
    }
    setIsCameraReady(false)
  }, [])

  // Detect face in current frame
  const detectFace = useCallback(async () => {
    if (!videoRef.current || !areModelsLoaded() || isDetecting) {
      return
    }

    setIsDetecting(true)

    try {
      const result = await detectSingleFaceWithDescriptor(videoRef.current)

      if (!result) {
        setFaceDetected(false)
        setDetectionMessage('No face detected. Please position your face in the frame.')
        return
      }

      // Validate face quality
      const validation = validateFaceQuality(result.detection)
      
      if (!validation.valid) {
        setFaceDetected(false)
        setDetectionMessage(validation.message)
        return
      }

      setFaceDetected(true)
      setDetectionMessage('Face detected! Hold still...')

      // Draw detection overlay
      if (showOverlay && canvasRef.current && videoRef.current) {
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        
        if (ctx) {
          canvas.width = videoRef.current.videoWidth
          canvas.height = videoRef.current.videoHeight
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          
          // Draw face box
          const box = result.detection.box
          ctx.strokeStyle = '#22c55e'
          ctx.lineWidth = 3
          ctx.strokeRect(box.x, box.y, box.width, box.height)
          
          // Draw corner accents
          const cornerSize = 20
          ctx.lineWidth = 4
          
          // Top-left corner
          ctx.beginPath()
          ctx.moveTo(box.x, box.y + cornerSize)
          ctx.lineTo(box.x, box.y)
          ctx.lineTo(box.x + cornerSize, box.y)
          ctx.stroke()
          
          // Top-right corner
          ctx.beginPath()
          ctx.moveTo(box.x + box.width - cornerSize, box.y)
          ctx.lineTo(box.x + box.width, box.y)
          ctx.lineTo(box.x + box.width, box.y + cornerSize)
          ctx.stroke()
          
          // Bottom-left corner
          ctx.beginPath()
          ctx.moveTo(box.x, box.y + box.height - cornerSize)
          ctx.lineTo(box.x, box.y + box.height)
          ctx.lineTo(box.x + cornerSize, box.y + box.height)
          ctx.stroke()
          
          // Bottom-right corner
          ctx.beginPath()
          ctx.moveTo(box.x + box.width - cornerSize, box.y + box.height)
          ctx.lineTo(box.x + box.width, box.y + box.height)
          ctx.lineTo(box.x + box.width, box.y + box.height - cornerSize)
          ctx.stroke()
        }
      }

      // Auto capture after delay if enabled
      if (autoCapture && captureTimeoutRef.current === null) {
        captureTimeoutRef.current = setTimeout(() => {
          if (videoRef.current) {
            const frameCanvas = captureVideoFrame(videoRef.current)
            onFaceDetected?.(result.descriptor, frameCanvas)
          }
          captureTimeoutRef.current = null
        }, captureDelay)
      }
    } catch (err) {
      console.error('Face detection error:', err)
    } finally {
      setIsDetecting(false)
    }
  }, [isDetecting, showOverlay, autoCapture, captureDelay, onFaceDetected])

  // Manual capture
  const captureNow = useCallback(async () => {
    if (!videoRef.current || !areModelsLoaded()) {
      return
    }

    setIsDetecting(true)

    try {
      const result = await detectSingleFaceWithDescriptor(videoRef.current)

      if (!result) {
        setError('No face detected. Please try again.')
        onError?.('No face detected')
        return
      }

      const validation = validateFaceQuality(result.detection)
      if (!validation.valid) {
        setError(validation.message)
        onError?.(validation.message)
        return
      }

      const frameCanvas = captureVideoFrame(videoRef.current)
      onFaceDetected?.(result.descriptor, frameCanvas)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to capture face'
      setError(message)
      onError?.(message)
    } finally {
      setIsDetecting(false)
    }
  }, [onFaceDetected, onError])

  // Start detection loop when camera is ready
  useEffect(() => {
    if (!isCameraReady) return

    const intervalId = setInterval(detectFace, 500) // Detect every 500ms

    return () => {
      clearInterval(intervalId)
    }
  }, [isCameraReady, detectFace])

  // Initialize on mount
  useEffect(() => {
    initializeCamera()

    return () => {
      stopCamera()
    }
  }, [initializeCamera, stopCamera])

  return (
    <div className={cn('relative rounded-xl overflow-hidden bg-black', className)}>
      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface z-10">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
          <p className="text-sm text-muted">Initializing camera...</p>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface z-10 p-6">
          <AlertCircle className="w-12 h-12 text-danger mb-4" />
          <p className="text-sm text-danger text-center mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null)
              initializeCamera()
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      )}

      {/* Video element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
        style={{ transform: 'scaleX(-1)' }} // Mirror mode
      />

      {/* Detection overlay canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ transform: 'scaleX(-1)' }}
      />

      {/* Face guide overlay */}
      {showOverlay && isCameraReady && !faceDetected && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-48 h-60 border-2 border-dashed border-white/50 rounded-[50%] flex items-center justify-center">
            <span className="text-white/70 text-sm text-center px-4">
              Position your face here
            </span>
          </div>
        </div>
      )}

      {/* Status bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                faceDetected ? 'bg-green-500' : 'bg-yellow-500',
                !isCameraReady && 'bg-gray-500'
              )}
            />
            <span className="text-white text-sm">
              {!isCameraReady
                ? 'Camera not ready'
                : faceDetected
                ? detectionMessage
                : detectionMessage || 'Looking for face...'}
            </span>
          </div>

          {!autoCapture && isCameraReady && (
            <button
              onClick={captureNow}
              disabled={isDetecting || !faceDetected}
              className={cn(
                'flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors',
                faceDetected
                  ? 'bg-primary text-white hover:bg-primary-light'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              )}
            >
              <Camera className="w-4 h-4" />
              Capture
            </button>
          )}
        </div>
      </div>

      {/* Mode indicator */}
      {overlayMode !== 'detection' && (
        <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/70 rounded-full">
          <span className="text-white text-xs font-medium uppercase">
            {overlayMode === 'registration' ? '📝 Registration' : '🔐 Login'}
          </span>
        </div>
      )}
    </div>
  )
}

export default FaceCamera
