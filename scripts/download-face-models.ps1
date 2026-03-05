# PowerShell script to download face-api.js models
# Run this from the project root directory

$modelsDir = "public/models"
$baseUrl = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights"

# Create models directory if it doesn't exist
if (!(Test-Path $modelsDir)) {
    New-Item -ItemType Directory -Force -Path $modelsDir
}

Write-Host "Downloading face-api.js models..." -ForegroundColor Cyan

# List of model files to download
$models = @(
    # Tiny Face Detector
    "tiny_face_detector_model-shard1",
    "tiny_face_detector_model-weights_manifest.json",
    
    # Face Landmark 68 Model
    "face_landmark_68_model-shard1",
    "face_landmark_68_model-weights_manifest.json",
    
    # Face Recognition Model
    "face_recognition_model-shard1",
    "face_recognition_model-shard2",
    "face_recognition_model-weights_manifest.json"
)

$successCount = 0
$failCount = 0

foreach ($model in $models) {
    $url = "$baseUrl/$model"
    $output = "$modelsDir/$model"
    
    Write-Host "  Downloading $model..." -NoNewline
    
    try {
        Invoke-WebRequest -Uri $url -OutFile $output -UseBasicParsing
        Write-Host " Done" -ForegroundColor Green
        $successCount++
    }
    catch {
        Write-Host " Failed" -ForegroundColor Red
        Write-Host "    Error: $_" -ForegroundColor Red
        $failCount++
    }
}

Write-Host ""
Write-Host "Download complete!" -ForegroundColor Cyan
Write-Host "  Success: $successCount" -ForegroundColor Green
Write-Host "  Failed:  $failCount" -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Red" })

if ($failCount -gt 0) {
    Write-Host ""
    Write-Host "Some downloads failed. You can try:" -ForegroundColor Yellow
    Write-Host "  1. Run this script again" -ForegroundColor Yellow
    Write-Host "  2. Download manually from: https://github.com/justadudewhohacks/face-api.js/tree/master/weights" -ForegroundColor Yellow
    Write-Host "  3. Use CDN models by updating MODEL_URL in src/services/faceApiService.ts" -ForegroundColor Yellow
}
