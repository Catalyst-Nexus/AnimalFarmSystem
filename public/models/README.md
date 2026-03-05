# Face Recognition Models

This folder contains the pretrained models required for face-api.js to perform face detection and recognition.

## Required Models

You need to download the following models from the face-api.js repository:

1. **tiny_face_detector_model** - Lightweight face detector
2. **face_landmark_68_model** - Face landmark detection (68 points)
3. **face_recognition_model** - Face descriptor extraction (128-dim vectors)

## Download Instructions

### Option 1: Download Script

Run the download script from the project root:

```bash
# On Windows (PowerShell)
.\scripts\download-face-models.ps1

# On Mac/Linux
./scripts/download-face-models.sh
```

### Option 2: Manual Download

Download the models from the official face-api.js repository:
https://github.com/justadudewhohacks/face-api.js/tree/master/weights

Then place them in this `public/models` directory.

Required files:
- `tiny_face_detector_model-shard1`
- `tiny_face_detector_model-weights_manifest.json`
- `face_landmark_68_model-shard1`
- `face_landmark_68_model-weights_manifest.json`
- `face_recognition_model-shard1`
- `face_recognition_model-shard2`
- `face_recognition_model-weights_manifest.json`

### Option 3: Use CDN

Alternatively, modify the `MODEL_URL` in `src/services/faceApiService.ts` to load from a CDN:

```typescript
// Change from:
const MODEL_URL = '/models'

// To use jsdelivr CDN:
const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'

// Or use unpkg:
const MODEL_URL = 'https://unpkg.com/@vladmandic/face-api/model'
```

## Verification

After adding the models, your folder structure should look like:

```
public/
  models/
    tiny_face_detector_model-shard1
    tiny_face_detector_model-weights_manifest.json
    face_landmark_68_model-shard1
    face_landmark_68_model-weights_manifest.json
    face_recognition_model-shard1
    face_recognition_model-shard2
    face_recognition_model-weights_manifest.json
```

## Troubleshooting

If you see errors loading models:

1. Check the browser console for 404 errors
2. Verify the model files are in the correct location
3. Ensure your dev server is serving static files from the `public` folder
4. Try using the CDN option as a fallback
