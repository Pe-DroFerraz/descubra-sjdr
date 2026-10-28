#Requires -Version 7.2
[CmdletBinding()]
param(
    [string]$BackupPath = 'C:\Users\pedro\Documents\DescubraSJDR-Backups\descubra-sjdr-backup.dump',
    [long]$ExpectedBytes = 521502,
    [int]$ExpectedEntries = 942,
    [string]$ReportDirectory
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
if (-not $IsWindows) { throw 'Este ponto de entrada exige Windows e Docker Desktop Linux. Use PowerShell 7.' }
Import-Module (Join-Path $PSScriptRoot 'Restore.Core.psm1') -Force
$result = Invoke-SjdrBackupValidation -BackupPath $BackupPath -ExpectedBytes $ExpectedBytes -ExpectedEntries $ExpectedEntries -ReportDirectory $ReportDirectory
Write-Host ('Resultado: ' + $result.status)
Write-Host ('Relatorio local: ' + $result.report_path)
Write-Host 'Nenhum destino remoto foi usado. Nao envie o dump ou o relatorio ao GitHub.'
if ($result.status -eq 'application_restored_with_limitations') { exit 0 }
exit 1
