# Iniciar la API con variables de entorno para desarrollo local.
# Uso: desde la raíz del repo, .\scripts\start-api.ps1
# Requiere: npm run docker:up y npm run db:setup (una vez), y npm run build --workspace=api

$env:DATABASE_URL = if ($env:DATABASE_URL) { $env:DATABASE_URL } else { "postgresql://sercop:sercop@localhost:5432/sercop" }
$env:JWT_SECRET = if ($env:JWT_SECRET) { $env:JWT_SECRET } else { "dev-secret-min-16-chars" }
$env:PORT = if ($env:PORT) { $env:PORT } else { "3080" }

Write-Host "Starting API (PORT=$env:PORT). Press Ctrl+C to stop."
Set-Location $PSScriptRoot\..
node apps/api/dist/index.js
