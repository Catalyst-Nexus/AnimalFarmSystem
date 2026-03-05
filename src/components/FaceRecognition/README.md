# Face Recognition Feature

This module provides face recognition capabilities for user authentication, allowing users to:
- **Register their face** for passwordless login
- **Login using face recognition** without entering credentials
- **Update or remove** their face registration

## Technology Stack

- **face-api.js**: Browser-based face detection and recognition library
- **Supabase**: Backend storage for face vectors and images
- **TensorFlow.js**: Underlying ML framework (via face-api.js)

## How It Works

1. **Face Detection**: Using TinyFaceDetector model for fast, accurate face detection
2. **Face Landmarks**: 68-point face landmark detection for alignment
3. **Face Recognition**: 128-dimensional face descriptor extraction
4. **Matching**: Euclidean distance comparison against stored vectors

## Setup Instructions

### 1. Install Dependencies

```bash
npm install face-api.js
```

### 2. Database Setup

Run the SQL migration in your Supabase SQL Editor:

```sql
-- Copy contents from sql/biometrics_migration.sql
```

Or run it via Supabase CLI:

```bash
supabase db push sql/biometrics_migration.sql
```

### 3. Storage Bucket Setup

In Supabase Dashboard:
1. Go to **Storage** → **Create new bucket**
2. Name: `face-images`
3. Public: **No** (private bucket)
4. Add storage policies (see SQL file for details)

### 4. Face-api.js Models

The models are loaded from a CDN by default. To use local models:

1. Download models:
   ```powershell
   .\scripts\download-face-models.ps1
   ```

2. Update `src/services/faceApiService.ts`:
   ```typescript
   const MODEL_URL = '/models'  // Use local models
   ```

## Components

### FaceCamera
Core camera component with real-time face detection overlay.

```tsx
import { FaceCamera } from '@/components/FaceRecognition'

<FaceCamera
  onFaceDetected={(descriptor, canvas) => {
    // Handle detected face
  }}
  autoCapture={true}
  overlayMode="login"
/>
```

### FaceRegistration
Modal component for registering or updating face data.

```tsx
import { FaceRegistration } from '@/components/FaceRecognition'

<FaceRegistration
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onSuccess={() => console.log('Face registered!')}
/>
```

### FaceLogin
Modal component for face-based authentication.

```tsx
import { FaceLogin } from '@/components/FaceRecognition'

<FaceLogin
  isOpen={showFaceLogin}
  onClose={() => setShowFaceLogin(false)}
  onSuccess={() => navigate('/dashboard')}
/>
```

## Services

### biometricsService.ts
- `hasRegisteredFace(userId)`: Check if user has face registered
- `registerFaceVector(userId, vector, imageUrl?)`: Register face
- `deleteFaceRegistration(userId)`: Remove face registration
- `getAllFaceVectors()`: Get all registered faces for matching
- `findMatchingFace(vector)`: Find best matching user

### faceApiService.ts
- `loadFaceApiModels()`: Load ML models
- `detectSingleFaceWithDescriptor(input)`: Detect face and get descriptor
- `euclideanDistance(v1, v2)`: Compare face vectors
- `validateFaceQuality(detection)`: Validate detection quality

## Security Considerations

1. **Face vectors are stored, not images** (by default)
2. **RLS policies** restrict access to own biometrics
3. **Matching threshold** of 0.6 balances security and usability
4. **Face login** requires a pre-authenticated session token (implementation varies)

## Configuration

### Match Threshold
Adjust in `biometricsService.ts`:

```typescript
export const FACE_MATCH_THRESHOLD = 0.6  // Lower = stricter
```

- `0.4-0.5`: Very strict (may reject valid users)
- `0.6`: Balanced (recommended)
- `0.7-0.8`: More lenient (may accept false matches)

### Model URL
Adjust in `faceApiService.ts`:

```typescript
// CDN (default - no setup needed)
const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'

// Local (requires model download)
const MODEL_URL = '/models'
```

## Troubleshooting

### "Face not detected"
- Ensure good lighting
- Face should be clearly visible
- Remove obstructions (glasses, masks)
- Move closer to camera

### "Models failed to load"
- Check network connectivity
- Try CDN fallback
- Verify local model files exist

### "Face not recognized"
- Re-register face with better lighting
- Try different angles during registration
- Adjust FACE_MATCH_THRESHOLD if needed

## Browser Support

- Chrome 60+ ✓
- Firefox 55+ ✓
- Safari 11+ ✓
- Edge 79+ ✓

Requires:
- WebRTC (camera access)
- WebGL (TensorFlow.js)
- ES2017+ support
