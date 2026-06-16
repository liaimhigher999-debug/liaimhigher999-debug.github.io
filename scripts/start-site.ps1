param(
  [switch]$NoOpen
)

$ErrorActionPreference = 'Stop'

$projectDirectory = Split-Path -Parent $PSScriptRoot
$siteUrl = 'http://127.0.0.1:5173/'
$serverScript = Join-Path $PSScriptRoot 'serve-dist.mjs'
$stdoutLog = Join-Path $PSScriptRoot 'site.log'
$stderrLog = Join-Path $PSScriptRoot 'site-error.log'

function Test-Site {
  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $siteUrl -TimeoutSec 2
    return $response.StatusCode -ge 200 -and $response.StatusCode -lt 500
  }
  catch {
    return $false
  }
}

function Start-ShellProcess {
  param(
    [string]$FileName,
    [string]$Arguments = '',
    [string]$WorkingDirectory = '',
    [System.Diagnostics.ProcessWindowStyle]$WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Normal
  )

  $startInfo = New-Object System.Diagnostics.ProcessStartInfo
  $startInfo.FileName = $FileName
  $startInfo.Arguments = $Arguments
  $startInfo.UseShellExecute = $true
  $startInfo.WindowStyle = $WindowStyle
  if ($WorkingDirectory) {
    $startInfo.WorkingDirectory = $WorkingDirectory
  }

  [System.Diagnostics.Process]::Start($startInfo) | Out-Null
}

if (-not (Test-Site)) {
  $node = Get-Command node.exe -ErrorAction SilentlyContinue
  if (-not $node) {
    throw 'node.exe was not found. Install Node.js, then run this script again.'
  }

  $command = "`"$($node.Source)`" `"$serverScript`" 1> `"$stdoutLog`" 2> `"$stderrLog`""
  Start-ShellProcess `
    -FileName $env:ComSpec `
    -Arguments "/d /s /c `"$command`"" `
    -WorkingDirectory $projectDirectory `
    -WindowStyle Hidden

  foreach ($attempt in 1..20) {
    Start-Sleep -Milliseconds 500
    if (Test-Site) {
      break
    }
  }

  if (-not (Test-Site)) {
    throw "The local site did not start. Run npm.cmd run build, then check $stderrLog"
  }
}

if (-not $NoOpen) {
  Start-ShellProcess -FileName $siteUrl
}
