# Start MongoDB with replica set for local development on Windows
# Run this if you're NOT using Docker

$dataDir = "$env:USERPROFILE\.pertodemim\mongodb"
$logFile = "$dataDir\mongod.log"

if (-not (Test-Path $dataDir)) {
    New-Item -ItemType Directory -Path $dataDir -Force | Out-Null
}

Write-Host "Starting MongoDB with replica set..."

# Start mongod in background
Start-Process -FilePath "mongod" -ArgumentList "--replSet rs0 --dbpath `"$dataDir`" --port 27017 --bind_ip_all --logpath `"$logFile`"" -WindowStyle Hidden

Start-Sleep -Seconds 3

Write-Host "Initializing replica set..."
$initScript = @"
try {
  rs.status();
  print('Replica set already initialized');
} catch(e) {
  rs.initiate({ _id: 'rs0', members: [{ _id: 0, host: 'localhost:27017' }] });
  print('Replica set initialized!');
}
"@

$initScript | mongosh

Write-Host "MongoDB ready! Connection string: mongodb://localhost:27017/pertodemim?replicaSet=rs0"
