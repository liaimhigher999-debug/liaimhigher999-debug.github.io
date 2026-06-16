$ErrorActionPreference = 'Stop'

$startupDirectory = [Environment]::GetFolderPath('Startup')
$shortcutPath = Join-Path $startupDirectory 'The 1975 Local Site.lnk'

if (Test-Path -LiteralPath $shortcutPath) {
  Remove-Item -LiteralPath $shortcutPath
  Write-Host "Removed login autostart shortcut: $shortcutPath"
}
else {
  Write-Host 'Login autostart shortcut is not installed.'
}
