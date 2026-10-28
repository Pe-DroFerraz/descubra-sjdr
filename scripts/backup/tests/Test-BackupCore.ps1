#Requires -Version 7.2
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
Import-Module (Join-Path $PSScriptRoot '../Restore.Core.psm1') -Force
function Assert($Condition,[string]$Message) { if(-not $Condition){throw $Message} }
function Denied([scriptblock]$Action) { try { & $Action; throw 'expected_refusal' } catch { if($_.Exception.Message -eq 'expected_refusal'){throw} } }
$errors=$null; $tokens=$null
foreach($file in @('../Restore.Core.psm1','../Test-SjdrBackup.ps1')) {
    [void][Management.Automation.Language.Parser]::ParseFile((Join-Path $PSScriptRoot $file),[ref]$tokens,[ref]$errors)
    Assert (-not $errors) 'PowerShell parse error'
}
$listing=@'
; Format: CUSTOM
; Compression: gzip
; TOC Entries: 942
; Dumped from database version: 17.11
; Dumped by pg_dump version: 17.11
1; 2615 100 SCHEMA - private postgres
2; 1259 101 TABLE public places postgres
3; 0 101 TABLE DATA public places postgres
4; 1259 103 INDEX public places_category_idx postgres
5; 1255 104 FUNCTION private published_place(uuid) postgres
6; 1255 105 FUNCTION public rls_auto_enable() postgres
7; 1259 106 TABLE auth users postgres
8; 0 106 TABLE DATA auth users postgres
9; 2606 107 FK CONSTRAINT public profiles profiles_id_fkey postgres
10; 3256 108 POLICY public places admin_all postgres
11; 0 0 ACL public TABLE places postgres
12; 3466 109 EVENT TRIGGER - ensure_rls postgres
'@
$toc=Read-SjdrToc $listing
Assert ($toc.header.Format -eq 'CUSTOM' -and $toc.header.'TOC Entries' -eq '942' -and $toc.listed_entries -eq 12) 'TOC header or entry count'
$selected=@(Select-SjdrApplicationEntries $toc.entries)
Assert ($selected.Count -eq 7) 'Incorrect application scope'
Assert (-not @($selected | Where-Object {$_.schema -eq 'auth' -or $_.name -like 'rls_auto_enable*'}).Count) 'Managed data or platform handler selected'
Assert (@($selected | Where-Object kind -eq 'INDEX').Count -eq 1) 'Secondary index dropped'
$hosts=@(Get-SjdrLocalDockerHosts)
if($IsWindows) { Assert (-not @($hosts | Where-Object {$_ -notlike 'npipe:////./pipe/*'}).Count) 'Nonlocal Windows endpoint' }
else { Assert ($hosts.Count -eq 1 -and $hosts[0] -eq 'unix:///var/run/docker.sock') 'Nonlocal test endpoint' }
Denied { Assert-SjdrLocalPath '\\remote\share\backup.dump' }
Denied { Assert-SjdrLocalPath 'https://itegpsgjtuclbsatcdxr.supabase.co' }
Denied { Assert-SjdrLocalPath (Join-Path $PSScriptRoot 'accidental.dump') }
Assert ((Get-SjdrFailureCode 'arbitraryprivatevalue') -eq 'unexpected_local_error_details_suppressed') 'Arbitrary exception leaked'
$parameters=(Get-Command Invoke-SjdrBackupValidation).Parameters.Keys
foreach($forbidden in @('Host','Server','ConnectionString','Password','Credential','DockerHost')) { Assert ($forbidden -notin $parameters) 'Remote/credential parameter exposed' }
# Failure reporting never copies arbitrary exception text or input contents.
$temp=Join-Path ([IO.Path]::GetTempPath()) ('sjdr-core-' + [Guid]::NewGuid().ToString('N'))
[void](New-Item -ItemType Directory -Path $temp)
try {
    $backup=Join-Path $temp 'fake.dump'
    [IO.File]::WriteAllText($backup,'SYNTHETIC_PRIVATE_CONTENT')
    $result=Invoke-SjdrBackupValidation -BackupPath $backup -ExpectedBytes 1 -ExpectedEntries 942 -ReportDirectory (Join-Path $temp 'report')
    $text=Get-Content -LiteralPath $result.report_path -Raw
    $report=$text|ConvertFrom-Json
    Assert ($report.status -eq 'failed' -and $report.failure -eq 'backup_size_or_expectation_mismatch') 'Unsafe file accepted'
    Assert ($text -notmatch 'SYNTHETIC_PRIVATE_CONTENT') 'Content copied into report'
    $existing=Join-Path $temp 'existing'; [void](New-Item -ItemType Directory -Path $existing)
    $marker=Join-Path $existing 'resultado.json'; [IO.File]::WriteAllText($marker,'preserve_existing_report')
    Denied { Invoke-SjdrBackupValidation -BackupPath $backup -ExpectedBytes 1 -ExpectedEntries 942 -ReportDirectory $existing }
    Assert ((Get-Content -LiteralPath $marker -Raw) -eq 'preserve_existing_report') 'Existing report overwritten'
} finally { Remove-Item -LiteralPath $temp -Recurse -Force }
Write-Host 'PowerShell core: parsing, scope, endpoint, path, credentials and failure-report checks passed.'
