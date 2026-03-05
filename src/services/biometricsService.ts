import { supabase, isSupabaseConfigured } from './supabase'

export interface BiometricRecord {
  id: string
  created_at: string
  face_vector: number[]
  face_image_url?: string
}

export interface FaceMatchResult {
  userId: string
  email: string
  username: string
  distance: number
  similarity: number
}

// Threshold for face matching (lower = more strict)
// 0.6 is generally a good balance between security and usability
export const FACE_MATCH_THRESHOLD = 0.6

/**
 * Check if a user has registered biometrics (face)
 */
export const hasRegisteredFace = async (userId: string): Promise<boolean> => {
  if (!isSupabaseConfigured() || !supabase) {
    console.error('Supabase is not configured')
    return false
  }

  try {
    const { data, error } = await supabase.rpc('check_face_registered', {
      user_id: userId,
    })

    if (error) {
      console.error('Error checking biometrics:', error)
      return false
    }

    return data === true
  } catch (error) {
    console.error('Error checking biometrics:', error)
    return false
  }
}

/**
 * Register a user's face vector
 */
export const registerFaceVector = async (
  userId: string,
  faceVector: number[],
  faceImageUrl?: string
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: 'Supabase is not configured' }
  }

  try {
    const { data, error } = await supabase.rpc('register_face_data', {
      user_id: userId,
      face_vector: faceVector,
      face_image_url: faceImageUrl || null,
    })

    if (error) {
      console.error('Error registering face:', error)
      return { success: false, error: error.message }
    }

    // RPC function returns JSON with success/error
    if (data && typeof data === 'object' && 'success' in data) {
      return data as { success: boolean; error?: string }
    }

    return { success: true }
  } catch (error) {
    console.error('Error registering face:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Delete a user's face registration
 */
export const deleteFaceRegistration = async (
  userId: string
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: 'Supabase is not configured' }
  }

  try {
    const { data, error } = await supabase.rpc('delete_face_data', {
      user_id: userId,
    })

    if (error) {
      console.error('Error deleting biometrics:', error)
      return { success: false, error: error.message }
    }

    // RPC function returns JSON with success/error
    if (data && typeof data === 'object' && 'success' in data) {
      return data as { success: boolean; error?: string }
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting face registration:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get all registered face vectors for matching
 */
export const getAllFaceVectors = async (): Promise<
  Array<{ userId: string; faceVector: number[]; email: string; username: string }>
> => {
  if (!isSupabaseConfigured() || !supabase) {
    console.error('Supabase is not configured')
    return []
  }

  try {
    const { data, error } = await supabase.rpc('get_all_face_vectors')

    if (error) {
      console.error('Error fetching face vectors:', error)
      return []
    }

    if (!data || data.length === 0) {
      return []
    }

    // Transform the data to match our interface
    return data.map((record: { user_id: string; face_vector: number[] }) => ({
      userId: record.user_id,
      faceVector: record.face_vector,
      email: '', // Email not needed for matching
      username: '', // Username not needed for matching
    }))
  } catch (error) {
    console.error('Error fetching face vectors:', error)
    return []
  }
}

/**
 * Upload face image to Supabase storage
 */
export const uploadFaceImage = async (
  userId: string,
  imageBlob: Blob
): Promise<{ url: string | null; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { url: null, error: 'Supabase is not configured' }
  }

  try {
    const fileName = `${userId}/face_${Date.now()}.jpg`

    const { error: uploadError } = await supabase.storage
      .from('face-images')
      .upload(fileName, imageBlob, {
        contentType: 'image/jpeg',
        upsert: true,
      })

    if (uploadError) {
      console.error('Error uploading face image:', uploadError)
      return { url: null, error: uploadError.message }
    }

    // Get public URL
    const { data } = supabase.storage.from('face-images').getPublicUrl(fileName)

    return { url: data.publicUrl }
  } catch (error) {
    console.error('Error uploading face image:', error)
    return {
      url: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Calculate Euclidean distance between two face vectors
 */
export const calculateEuclideanDistance = (
  vector1: number[],
  vector2: number[]
): number => {
  if (vector1.length !== vector2.length) {
    throw new Error('Vectors must have the same length')
  }

  let sum = 0
  for (let i = 0; i < vector1.length; i++) {
    sum += Math.pow(vector1[i] - vector2[i], 2)
  }
  return Math.sqrt(sum)
}

/**
 * Find the best matching face from registered users
 */
export const findMatchingFace = async (
  capturedVector: number[]
): Promise<FaceMatchResult | null> => {
  const registeredFaces = await getAllFaceVectors()

  if (registeredFaces.length === 0) {
    return null
  }

  let bestMatch: FaceMatchResult | null = null
  let minDistance = Infinity

  for (const face of registeredFaces) {
    try {
      const distance = calculateEuclideanDistance(capturedVector, face.faceVector)
      
      if (distance < minDistance && distance < FACE_MATCH_THRESHOLD) {
        minDistance = distance
        bestMatch = {
          userId: face.userId,
          email: face.email,
          username: face.username,
          distance,
          similarity: 1 - distance, // Convert distance to similarity percentage
        }
      }
    } catch (error) {
      console.error('Error comparing face vectors:', error)
    }
  }

  return bestMatch
}
