Write-Host "🚀 Setting up Amazon Nova Hackathon Project..." -ForegroundColor Green

# Backend setup
Write-Host "`n📦 Setting up Backend..." -ForegroundColor Cyan
Set-Location backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
deactivate
Set-Location ..

# Frontend setup
Write-Host "`n📦 Setting up Frontend..." -ForegroundColor Cyan
Set-Location frontend
npm install
Set-Location ..

# Agent setup check
Write-Host "`n📦 Checking Agent setup..." -ForegroundColor Cyan
if (-not (Test-Path "agent\.venv")) {
    Write-Host "Agent venv not found. Please run 'agentcore create' or set up manually." -ForegroundColor Yellow
}

Write-Host "`n✅ Setup complete!" -ForegroundColor Green
Write-Host "`nNext steps:"
Write-Host "1. Deploy agent: cd agent; agentcore deploy"
Write-Host "2. Start backend: cd backend; .\.venv\Scripts\Activate.ps1; cd src; python main.py"
Write-Host "3. Start frontend: cd frontend; npm run dev"
