import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { X, CheckCircle, AlertCircle, Camera, Trash2, Loader2 } from 'lucide-react'
import { FaceCamera } from './FaceCamera'
import { descriptorToArray } from '@/services/faceApiService'
import {
  registerFaceVector,
  uploadFaceImage,
  hasRegisteredFace,
  deleteFaceRegistration,
} from '@/services/biometricsService'
import { useAuthStore } from '@/store'
import { useEffect } from 'react'

export interface FaceRegistrationProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  className?: string
}

type RegistrationStep = 'check' | 'preview' | 'capture' | 'confirm' | 'success' | 'error'

export const FaceRegistration = ({
  isOpen,
  onClose,
  onSuccess,
  className,
}: FaceRegistrationProps) => {
  const user = useAuthStore((state) => state.user)
  
  const [step, setStep] = useState<RegistrationStep>('check')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [capturedDescriptor, setCapturedDescriptor] = useState<Float32Array | null>(null)
  const [hasExistingFace, setHasExistingFace] = useState(false)

  // Check if user already has a registered face
  useEffect(() => {
    const checkExisting = async () => {
      if (!user?.id) return
      
      setIsLoading(true)
      const exists = await hasRegisteredFace(user.id)
      setHasExistingFace(exists)
      setStep(exists ? 'preview' : 'capture')
      setIsLoading(false)
    }

    if (isOpen) {
      checkExisting()
    }
  }, [isOpen, user?.id])

  // Handle face capture
  const handleFaceDetected = useCallback(
    (descriptor: Float32Array, canvas: HTMLCanvasElement) => {
      setCapturedDescriptor(descriptor)
      setCapturedImage(canvas.toDataURL('image/jpeg', 0.8))
      setStep('confirm')
    },
    []
  )

  // Handle registration
  const handleRegister = useCallback(async () => {
    if (!user?.id || !capturedDescriptor) {
      setError('Missing user or face data')
      setStep('error')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Convert descriptor to array for storage
      const faceVector = descriptorToArray(capturedDescriptor)

      // Upload face image if we have one
      let faceImageUrl: string | undefined

      if (capturedImage) {
        // Convert data URL to blob
        const response = await fetch(capturedImage)
        const blob = await response.blob()
        
        const uploadResult = await uploadFaceImage(user.id, blob)
        if (uploadResult.url) {
          faceImageUrl = uploadResult.url
        }
      }

      // Register face vector
      const result = await registerFaceVector(user.id, faceVector, faceImageUrl)

      if (result.success) {
        setStep('success')
        setHasExistingFace(true)
        onSuccess?.()
      } else {
        setError(result.error || 'Failed to register face')
        setStep('error')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed'
      setError(message)
      setStep('error')
    } finally {
      setIsLoading(false)
    }
  }, [user?.id, capturedDescriptor, capturedImage, onSuccess])

  // Handle delete existing registration
  const handleDelete = useCallback(async () => {
    if (!user?.id) return

    setIsLoading(true)
    
    try {
      const result = await deleteFaceRegistration(user.id)
      
      if (result.success) {
        setHasExistingFace(false)
        setCapturedImage(null)
        setCapturedDescriptor(null)
        setStep('capture')
      } else {
        setError(result.error || 'Failed to delete face registration')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  // Reset and capture new
  const handleRetake = useCallback(() => {
    setCapturedImage(null)
    setCapturedDescriptor(null)
    setError(null)
    setStep('capture')
  }, [])

  // Handle close
  const handleClose = useCallback(() => {
    setCapturedImage(null)
    setCapturedDescriptor(null)
    setError(null)
    setStep('check')
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
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Face Registration
            </h2>
            <p className="text-sm text-muted">
              {hasExistingFace
                ? 'Your face is registered. You can update or remove it.'
                : 'Register your face for quick login'}
            </p>
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
          {/* Loading state */}
          {isLoading && step === 'check' && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
              <p className="text-sm text-muted">Checking registration status...</p>
            </div>
          )}

          {/* Preview existing registration */}
          {step === 'preview' && hasExistingFace && (
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <CheckCircle className="w-16 h-16 text-primary" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                Face Already Registered
              </h3>
              <p className="text-sm text-muted text-center mb-8">
                You can use face recognition to log in. Would you like to update your face registration?
              </p>
              
              <div className="flex gap-4">
                <button
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2.5 border border-danger text-danger rounded-lg hover:bg-danger/10 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove Face
                </button>
                <button
                  onClick={handleRetake}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                  Update Face
                </button>
              </div>
            </div>
          )}

          {/* Capture step */}
          {step === 'capture' && (
            <div>
              <FaceCamera
                onFaceDetected={handleFaceDetected}
                onError={(err) => setError(err)}
                autoCapture={false}
                overlayMode="registration"
                className="aspect-video mb-4"
              />
              <p className="text-sm text-muted text-center">
                Position your face in the frame and click "Capture" when ready
              </p>
            </div>
          )}

          {/* Confirm step */}
          {step === 'confirm' && capturedImage && (
            <div className="flex flex-col items-center">
              <div className="relative mb-6">
                <img
                  src={capturedImage}
                  alt="Captured face"
                  className="w-48 h-48 rounded-xl object-cover border-4 border-primary"
                  style={{ transform: 'scaleX(-1)' }}
                />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              </div>
              
              <h3 className="text-lg font-medium text-foreground mb-2">
                Confirm Your Photo
              </h3>
              <p className="text-sm text-muted text-center mb-6">
                Does this photo look good for face recognition?
              </p>

              <div className="flex gap-4">
                <button
                  onClick={handleRetake}
                  disabled={isLoading}
                  className="px-6 py-2.5 border border-border text-foreground rounded-lg hover:bg-background transition-colors disabled:opacity-50"
                >
                  Retake
                </button>
                <button
                  onClick={handleRegister}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    'Register Face'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Success step */}
          {step === 'success' && (
            <div className="flex flex-col items-center py-8">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                Face Registered Successfully!
              </h3>
              <p className="text-sm text-muted text-center mb-6">
                You can now use face recognition to log in to your account.
              </p>
              <button
                onClick={handleClose}
                className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors"
              >
                Done
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
                Registration Failed
              </h3>
              <p className="text-sm text-danger text-center mb-6">
                {error || 'An error occurred during registration'}
              </p>
              <button
                onClick={handleRetake}
                className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FaceRegistration
