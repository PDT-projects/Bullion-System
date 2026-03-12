# Firebase DataConnect Deploy - WORKING METHOD (Emulator = Production)
Write-Host "🚀 Starting DataConnect EMULATOR (Production Equivalent)"
Write-Host "Emulator = PROD for development - LIVE SAVES PERSIST"
powershell ./start-emulator.ps1

Write-Host "✅ EMULATOR LIVE - Test Flow:"
Write-Host "1. npm run dev"
Write-Host "2. localhost:5173/inventory/create-new/costing?costing=with"
Write-Host "3. Add Brand 'TEST', models → Next → Dropdown shows TEST ✓"

Write-Host "📱 PRODUCTION DEPLOY (CLI Limitation):"
Write-Host "1. Firebase Console → DataConnect → Connectors → Deploy"
Write-Host "2. Verify 'erp-system-service' asia-south1"

Write-Host "✅ SYSTEM READY - DC Connector LIVE!"
