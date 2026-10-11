param([string]$BaseUrl = "http://127.0.0.1:8000")
$ErrorActionPreference = "Stop"
$health = Invoke-RestMethod "$BaseUrl/v1/health" -TimeoutSec 8
$health | ConvertTo-Json -Depth 6
$question = @{ topic="career"; mood="curious"; language="en"; durationMinutes=10 } | ConvertTo-Json
Invoke-RestMethod "$BaseUrl/v1/questions" -Method Post -ContentType "application/json" -Body $question -TimeoutSec 45 | ConvertTo-Json -Depth 6
$journal = @{ language="en"; topic="career"; transcripts=@(@{ clipId="smoke"; text="I noticed that I want to slow down and take a short walk tomorrow." }) } | ConvertTo-Json -Depth 5
Invoke-RestMethod "$BaseUrl/v1/journal" -Method Post -ContentType "application/json" -Body $journal -TimeoutSec 90 | ConvertTo-Json -Depth 6
Write-Host "Transcription availability:" $health.models.transcribe.ready
