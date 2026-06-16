$ErrorActionPreference = 'Stop'

$startupDirectory = [Environment]::GetFolderPath('Startup')
$shortcutPath = Join-Path $startupDirectory 'The 1975 Local Site.lnk'
$projectDirectory = Split-Path -Parent $PSScriptRoot
$startScript = Join-Path $projectDirectory 'start-site.cmd'

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $startScript
$shortcut.Arguments = '--no-open'
$shortcut.WorkingDirectory = $projectDirectory
$shortcut.WindowStyle = 7
$shortcut.Description = 'Start the The 1975 local preview server'
$shortcut.Save()

Write-Host "Installed login autostart shortcut: $shortcutPath"
