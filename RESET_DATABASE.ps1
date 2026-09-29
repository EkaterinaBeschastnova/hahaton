$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Db = Join-Path $Root "backend\mydom.db"

if (Test-Path $Db) {
    Remove-Item $Db -Force
    Write-Host "Старая demo-база удалена. При следующем запуске backend создаст новую." -ForegroundColor Green
} else {
    Write-Host "mydom.db уже отсутствует — backend создаст её при запуске." -ForegroundColor Yellow
}
