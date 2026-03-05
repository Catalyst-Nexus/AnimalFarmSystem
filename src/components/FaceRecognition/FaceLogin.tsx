import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { cn } from '@/lib/utils'
import { X, CheckCircle, AlertCircle, Loader2, Scan, ArrowLeft } from 'lucide-react'
import { FaceCamera } from './FaceCamera'
import { descriptorToArray, euclideanDistance } from '@/services/faceApiService'
import {
  getAllFaceVectors,
  FACE_MATCH_THRESHOLD,
} from '@/services/biometricsService'
import { supabase, isSupabaseConfigured } from '@/services/supabase'

export interface FaceLoginProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  className?: string
}

type LoginStep = 'scanning' | 'matching' | 'success' | 'error'

interface MatchedUser {
  userId: string
  email: string
  username: string
  similarity: number
}

export const FaceLogin = ({
  isOpen,
  onClose,
  onSuccess,
  className,
}: FaceLoginProps) => {
  const navigate = useNavigate()
  
  const [step, setStep] = useState<LoginStep>('scanning')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [matchedUser, setMatchedUser] = useState<MatchedUser | null>(null)
  const [registeredFaces, setRegisteredFaces] = useState<
    Array<{ userId: string; faceVector: number[]; email: string; username: string }>
  >([])

  // Load registered faces on mount
  useEffect(() => {
    const loadFaces = async () => {
      const faces = await getAllFaceVectors()
      setRegisteredFaces(faces)
    }

    if (isOpen) {
      loadFaces()
    }
  }, [isOpen])

  // Handle face detected - match against registered faces
  const handleFaceDetected = useCallback(
    async (descriptor: Float32Array) => {
      if (registeredFaces.length === 0) {
        setError('No registered faces found. Please register your face first.')
        setStep('error')
        return
      }

      setStep('matching')
      setIsLoading(true)

      try {
        const capturedVector = descriptorToArray(descriptor)
        
        let bestMatch: MatchedUser | null = null
        let minDistance = Infinity

        // Compare against all registered faces
        for (const face of registeredFaces) {
          const distance = euclideanDistance(capturedVector, face.faceVector)
          
          if (distance < minDistance && distance < FACE_MATCH_THRESHOLD) {
            minDistance = distance
            bestMatch = {
              userId: face.userId,
              email: face.email,
              username: face.username,
              similarity: Math.round((1 - distance) * 100),
            }
          }
        }

        if (!bestMatch) {
          setError('Face not recognized. Please try again or use email/password login.')
          setStep('error')
          return
        }

        // Verify user is confirmed
        if (!isSupabaseConfigured() || !supabase) {
          setError('Supabase is not configured')
          setStep('error')
          return
        }

        setMatchedUser(bestMatch)
        setStep('success')
        
      } catch (err) {
        console.error('Face matching error:', err)
        setError(err instanceof Error ? err.message : 'Failed to match face')
        setStep('error')
      } finally {
        setIsLoading(false)
      }
    },
    [registeredFaces]
  )

  // Complete login after face match
  const handleCompleteLogin = useCallback(async () => {
    if (!matchedUser) return

    setIsLoading(true)

    try {
      // Use the authStore's loginWithFace to set up the session
      const { useAuthStore } = await import('@/store')
      const loginWithFace = useAuthStore.getState().loginWithFace
      
      const success = await loginWithFace(matchedUser.userId)
      
      if (success) {
        onSuccess?.()
        navigate('/dashboard')
        onClose()
      } else {
        setError('Failed to complete login. Please try password login.')
        setStep('error')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
      setStep('error')
    } finally {
      setIsLoading(false)
    }
  }, [matchedUser, navigate, onClose, onSuccess])

  // Reset and try again
  const handleRetry = useCallback(() => {
    setMatchedUser(null)
    setError(null)
    setStep('scanning')
  }, [])

  // Handle close
  const handleClose = useCallback(() => {
    setMatchedUser(null)
    setError(null)
    setStep('scanning')
    onClose()
  }, [onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className={cn(
          'relative w-full max-w-lg bg-surface rounded-2xl shadow-2xl overflow-hidden',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              title="Go back"
              className="p-1.5 rounded-lg hover:bg-background transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-muted" />
            </button>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Face Login
              </h2>
              <p className="text-sm text-muted">
                Look at the camera to sign in
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            title="Close"
            className="p-2 rounded-lg hover:bg-background transition-colors"
          >
            <X className="w-5 h-5 text-muted" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Scanning step */}
          {step === 'scanning' && (
            <div>
              <FaceCamera
                onFaceDetected={handleFaceDetected}
                onError={(err) => {
                  setError(err)
                  setStep('error')
                }}
                autoCapture={true}
                captureDelay={1500}
                overlayMode="login"
                className="aspect-video mb-4"
              />
              <div className="flex items-center justify-center gap-2 text-sm text-muted">
                <Scan className="w-4 h-4 animate-pulse" />
                <span>Position your face in the frame. Auto-detecting...</span>
              </div>
              
              {registeredFaces.length === 0 && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 text-center">
                    No registered faces found. Please use email/password login or register your face first.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Matching step */}
          {step === 'matching' && (
            <div className="flex flex-col items-center py-12">
              <div className="relative">
                <Loader2 className="w-16 h-16 text-primary animate-spin" />
                <Scan className="w-8 h-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="mt-6 text-sm text-muted">Matching face...</p>
            </div>
          )}

          {/* Success step */}
          {step === 'success' && matchedUser && (
            <div className="flex flex-col items-center py-8">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                Welcome back!
              </h3>
              <p className="text-sm text-muted text-center mb-2">
                Face recognized with {matchedUser.similarity}% confidence
              </p>
              <p className="text-base font-medium text-foreground mb-6">
                {matchedUser.username || matchedUser.email}
              </p>
              
              <button
                onClick={handleCompleteLogin}
                disabled={isLoading}
                className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Continue to Dashboard'
                )}
              </button>

              <button
                onClick={handleRetry}
                className="mt-3 text-sm text-muted hover:text-foreground transition-colors"
              >
                Not you? Try again
              </button>
            </div>
          )}

          {/* Error step */}
          {step === 'error' && (
            <div className="flex flex-col items-center py-8">
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
                <AlertCircle className="w-10 h-10 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                Face Not Recognized
              </h3>
              <p className="text-sm text-danger text-center mb-6 max-w-xs">
                {error || 'Could not recognize your face. Please try again or use email/password login.'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="px-5 py-2.5 border border-border text-foreground rounded-lg hover:bg-background transition-colors"
                >
                  Use Password
                </button>
                <button
                  onClick={handleRetry}
                  className="px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer tip */}
        {step === 'scanning' && (
          <div className="px-6 py-4 bg-background border-t border-border">
            <p className="text-xs text-muted text-center">
              💡 Tip: Ensure good lighting and look directly at the camera for best results
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default FaceLogin
