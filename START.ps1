$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Backend = Join-Path $Root "backend"
$Frontend = Join-Path $Root "frontend"

$Python = Join-Path $Backend ".venv\Scripts\python.exe"

if (-not (Test-Path $Python)) {
    Write-Host "Не найден backend\.venv. Создай окружение или перенеси существующую .venv." -ForegroundColor Red
    exit 1
}

Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$Backend'; & '$Python' -m uvicorn app.main:app --reload --port 8000"
)

Start-Sleep -Seconds 2

Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$Frontend'; npm run dev"
)

Write-Host "Backend и frontend запущены в двух окнах PowerShell." -ForegroundColor Green
