# Start backend (NestJS on :8080) and frontend (Next.js on :3001)
Write-Host "Starting backend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList '-NoExit', '-Command', "Set-Location '$PSScriptRoot\backend'; npm run start:dev" -WindowStyle Normal

Write-Host "Starting frontend on port 3001..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList '-NoExit', '-Command', "Set-Location '$PSScriptRoot\frontend'; npm run dev -- -p 3001" -WindowStyle Normal

Write-Host ""
Write-Host "Backend  → http://localhost:8080/api/v1/" -ForegroundColor Green
Write-Host "Frontend → http://localhost:3001" -ForegroundColor Green
Write-Host ""
Write-Host "Note: backend takes ~90s for TypeScript compilation on first start." -ForegroundColor Yellow
