$r = Invoke-RestMethod -Uri 'http://localhost:3000/api/debug-db' -TimeoutSec 30
$r | ConvertTo-Json -Depth 5
