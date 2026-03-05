import * as faceapi from 'face-api.js'

// Track model loading state
let modelsLoaded = false
let modelsLoading = false

// Model URLs - local path or CDN fallback
// Local: Models should be placed in the public/models folder
// CDN: Uses jsdelivr CDN as fallback
// Change to '/models' if you have local models downloaded
const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'

/**
 * Load face-api.js models
 * Models should be placed in the public/models folder
 */
export const loadFaceApiModels = async (): Promise<boolean> => {
  if (modelsLoaded) {
    return true
  }

  if (modelsLoading) {
    // Wait for loading to complete
    while (modelsLoading) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    return modelsLoaded
  }

  modelsLoading = true

  try {
    console.log('Loading face-api.js models...')
    
    // Load required models
    await Promise.all([
      // TinyFaceDetector is lighter and faster than SSD MobileNet
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      // Face landmark detection for alignment
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      // Face recognition model for generating face descriptors (128-dim vectors)
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ])

    modelsLoaded = true
    console.log('Face-api.js models loaded successfully')
    return true
  } catch (error) {
    console.error('Error loading face-api.js models:', error)
    modelsLoaded = false
    return false
  } finally {
    modelsLoading = false
  }
}

/**
 * Check if models are loaded
 */
export const areModelsLoaded = (): boolean => {
  return modelsLoaded
}

/**
 * Detect faces in an image/video element
 */
export const detectFaces = async (
  input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
): Promise<faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }, faceapi.FaceLandmarks68>[]> => {
  if (!modelsLoaded) {
    throw new Error('Face-api.js models not loaded. Call loadFaceApiModels() first.')
  }

  const detections = await faceapi
    .detectAllFaces(input, new faceapi.TinyFaceDetectorOptions({
      inputSize: 416,
      scoreThreshold: 0.5,
    }))
    .withFaceLandmarks()

  return detections
}

/**
 * Detect a single face and get its descriptor (128-dimensional vector)
 */
export const detectSingleFaceWithDescriptor = async (
  input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
): Promise<{
  detection: faceapi.FaceDetection
  landmarks: faceapi.FaceLandmarks68
  descriptor: Float32Array
} | null> => {
  if (!modelsLoaded) {
    throw new Error('Face-api.js models not loaded. Call loadFaceApiModels() first.')
  }

  const result = await faceapi
    .detectSingleFace(input, new faceapi.TinyFaceDetectorOptions({
      inputSize: 416,
      scoreThreshold: 0.5,
    }))
    .withFaceLandmarks()
    .withFaceDescriptor()

  if (!result) {
    return null
  }

  return {
    detection: result.detection,
    landmarks: result.alignedRect ? result.alignedRect as unknown as faceapi.FaceLandmarks68 : result.landmarks,
    descriptor: result.descriptor,
  }
}

/**
 * Convert Float32Array descriptor to regular number array for storage
 */
export const descriptorToArray = (descriptor: Float32Array): number[] => {
  return Array.from(descriptor)
}

/**
 * Convert number array back to Float32Array for comparison
 */
export const arrayToDescriptor = (array: number[]): Float32Array => {
  return new Float32Array(array)
}

/**
 * Calculate Euclidean distance between two face descriptors
 */
export const euclideanDistance = (
  descriptor1: Float32Array | number[],
  descriptor2: Float32Array | number[]
): number => {
  const d1 = descriptor1 instanceof Float32Array ? descriptor1 : new Float32Array(descriptor1)
  const d2 = descriptor2 instanceof Float32Array ? descriptor2 : new Float32Array(descriptor2)

  return faceapi.euclideanDistance(d1, d2)
}

/**
 * Draw face detection overlay on a canvas
 */
export const drawFaceDetection = (
  canvas: HTMLCanvasElement,
  detection: faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }, faceapi.FaceLandmarks68>,
  options?: {
    boxColor?: string
    landmarkColor?: string
    withLandmarks?: boolean
  }
): void => {
  const { boxColor = '#00ff00', landmarkColor = '#00ff00', withLandmarks = true } = options || {}

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Draw detection box
  const box = detection.detection.box
  ctx.strokeStyle = boxColor
  ctx.lineWidth = 2
  ctx.strokeRect(box.x, box.y, box.width, box.height)

  // Draw landmarks if requested
  if (withLandmarks) {
    const landmarks = detection.landmarks
    ctx.fillStyle = landmarkColor
    landmarks.positions.forEach((point) => {
      ctx.beginPath()
      ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI)
      ctx.fill()
    })
  }
}

/**
 * Capture frame from video as canvas
 */
export const captureVideoFrame = (
  video: HTMLVideoElement
): HTMLCanvasElement => {
  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.drawImage(video, 0, 0)
  }
  
  return canvas
}

/**
 * Convert canvas to blob for upload
 */
export const canvasToBlob = (
  canvas: HTMLCanvasElement,
  type: string = 'image/jpeg',
  quality: number = 0.8
): Promise<Blob | null> => {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob),
      type,
      quality
    )
  })
}

/**
 * Validate face detection quality
 */
export const validateFaceQuality = (
  detection: faceapi.FaceDetection,
  minScore: number = 0.5,
  minSize: number = 100
): { valid: boolean; message: string } => {
  if (detection.score < minScore) {
    return {
      valid: false,
      message: 'Face detection confidence is too low. Please ensure good lighting.',
    }
  }

  const box = detection.box
  if (box.width < minSize || box.height < minSize) {
    return {
      valid: false,
      message: 'Face is too small. Please move closer to the camera.',
    }
  }

  return { valid: true, message: 'Face detected successfully' }
}

// Re-export face-api for direct access if needed
export { faceapi }
