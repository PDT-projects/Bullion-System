Write-Host "Deploying Firebase DataConnect to PRODUCTION"
Write-Host "1. Deploy dataconnect config"
firebase deploy --only dataconnect:dataconnect

Write-Host "2. Deploy ALL connectors"
firebase deploy --only "dataconnect:banking,dataconnect:budgets,dataconnect:inventory,dataconnect:loans,dataconnect:employees"

Write-Host "✅ DataConnect DEPLOYED to PRODUCTION"
Write-Host "Test: Check Firebase Console → DataConnect → your connectors"
