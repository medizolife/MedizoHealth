# Push healthmobile to all 3 repositories
# Usage: Right-click -> Run with PowerShell, or run from terminal: .\push-all.ps1

Set-Location "d:\health\Health New\healthmobile"

$message = Read-Host "Enter commit message"

git add .
git commit -m "$message"

Write-Host "`n--- Pushing to medizoprod ---" -ForegroundColor Cyan
git push medizoprod main

Write-Host "`n--- Pushing to medizomobile ---" -ForegroundColor Cyan
git push medizomobile main

Write-Host "`n--- Pushing to medizohealth ---" -ForegroundColor Cyan
git push medizohealth main

Write-Host "`nDone! Pushed to all 3 repositories." -ForegroundColor Green
Read-Host "Press Enter to close"
