#Requires -Version 7.2
# SYNTHETIC local fixture only; never reads the user's Windows backup.
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
if($IsWindows){throw 'CI integration uses a local Linux Docker socket; Windows entrypoint is tested separately.'}
Import-Module (Join-Path $PSScriptRoot '../Restore.Core.psm1') -Force
function Assert($Condition,[string]$Message){if(-not $Condition){throw $Message}}
function Docker([string[]]$Arguments){
    & (Get-Module Restore.Core) {param($a) Invoke-SjdrProcess -File (Get-Command docker -CommandType Application).Source -Arguments (@('--host','unix:///var/run/docker.sock')+$a)} $Arguments
}
function Checked([string[]]$Arguments){$r=Docker $Arguments;if($r.code -ne 0){throw ('Synthetic fixture setup failed: '+$Arguments[0]+'; exit '+$r.code+'; raw output suppressed')};return $r}
$root=(Resolve-Path (Join-Path $PSScriptRoot '../../..')).Path
$temp=Join-Path ([IO.Path]::GetTempPath()) ('sjdr-synthetic-' + [Guid]::NewGuid().ToString('N'))
[void](New-Item -ItemType Directory -Path $temp)
$container='sjdr-source-'+[Guid]::NewGuid().ToString('N')
try {
    $image=Docker @('image','inspect','postgres:17.11');if($image.code-ne 0){[void](Checked @('pull','postgres:17.11'))}
    [void](Checked @('run','-d','--name',$container,'--network','none','--log-driver','none','--tmpfs','/var/lib/postgresql/data','-e','POSTGRES_HOST_AUTH_METHOD=trust','postgres:17.11'))
    $ready=$false
    for($i=0;$i-lt 60;$i++){
        $pid1=Docker @('exec',$container,'cat','/proc/1/comm')
        if($pid1.code-eq 0 -and $pid1.stdout.Trim()-eq 'postgres' -and (Docker @('exec',$container,'pg_isready','-U','postgres')).code-eq 0){$ready=$true;break}
        Start-Sleep -Milliseconds 500
    }
    Assert $ready 'Fixture database not ready'
    foreach($file in @('supabase/tests/bootstrap.sql','supabase/migrations/202610220001_core.sql','supabase/migrations/202610220002_storage.sql','supabase/migrations/202610220003_tourist_catalog.sql')){
        [void](Checked @('cp',(Join-Path $root $file),($container+':/tmp/input.sql')))
        [void](Checked @('exec',$container,'psql','-X','-U','postgres','-v','ON_ERROR_STOP=1','-f','/tmp/input.sql'))
    }
    $seed=@'
alter table auth.users add column encrypted_password text;
insert into auth.users values ('f1000000-0000-4000-8000-000000000001','fixture@example.invalid','SYNTHETIC_AUTH_HASH');
insert into public.profiles(id,display_name) values ('f1000000-0000-4000-8000-000000000001','SYNTHETIC_PRIVATE_VALUE');
insert into public.categories(id,slug,name) values ('f2000000-0000-4000-8000-000000000001','fixture','SYNTHETIC');
insert into public.places(category_id,slug,name) values ('f2000000-0000-4000-8000-000000000001','synthetic','SYNTHETIC');
'@
    $seedPath=Join-Path $temp 'seed.sql';[IO.File]::WriteAllText($seedPath,$seed)
    [void](Checked @('cp',$seedPath,($container+':/tmp/seed.sql')))
    [void](Checked @('exec',$container,'psql','-X','-U','postgres','-v','ON_ERROR_STOP=1','-f','/tmp/seed.sql'))
    foreach($mode in @('valid','unsupported')){
        if($mode-eq 'unsupported'){
            $unsupported=@'
create function public.synthetic_secret_marker(text) returns text language sql immutable as 'select $1';
create index synthetic_idx on public.places(public.synthetic_secret_marker(name));
'@
            $path=Join-Path $temp 'unsupported.sql';[IO.File]::WriteAllText($path,$unsupported)
            [void](Checked @('cp',$path,($container+':/tmp/unsupported.sql')))
            [void](Checked @('exec',$container,'psql','-X','-U','postgres','-v','ON_ERROR_STOP=1','-f','/tmp/unsupported.sql'))
        }
        [void](Checked @('exec',$container,'pg_dump','-U','postgres','-Fc','--compress=gzip','--file=/tmp/fixture.dump','postgres'))
        $backup=Join-Path $temp ($mode+'.dump');[void](Checked @('cp',($container+':/tmp/fixture.dump'),$backup))
        $listing=Checked @('exec',$container,'pg_restore','--list','/tmp/fixture.dump')
        $toc=Read-SjdrToc $listing.stdout
        # Synthetic expectations deliberately differ from the unavailable real 521502-byte/942-entry archive.
        $result=Invoke-SjdrBackupValidation -BackupPath $backup -ExpectedBytes (Get-Item $backup).Length -ExpectedEntries ([int]$toc.header.'TOC Entries') -ReportDirectory (Join-Path $temp ('report-'+$mode))
        $text=Get-Content -LiteralPath $result.report_path -Raw;$report=$text|ConvertFrom-Json
        Assert ($report.cleanup-eq 'removed') 'Container cleanup failed'
        Assert ($text-notmatch 'SYNTHETIC_PRIVATE_VALUE|SYNTHETIC_AUTH_HASH|synthetic_secret_marker') 'Private values/raw errors leaked'
        if($mode-eq 'valid'){
            if($report.status-ne 'application_restored_with_limitations'){Write-Host ('Failure stage: '+$report.failure);throw 'Synthetic application restore failed'}
            Assert ($report.integrity.auth_users_restored-eq $false) 'Auth users restored'
            Assert ($report.table_counts.Count-eq 29) 'Incomplete table inventory'
            Assert (@($report.table_counts|Where-Object {$_.table-eq 'profiles'-and $_.rows-eq 1}).Count-eq 1) 'Application rows not restored'
            Assert ($report.excluded_managed_foreign_keys-eq 9) 'External FK limitations not identified'
        }else{
            Assert ($report.status-eq 'failed'-and $report.failure-eq 'failed_restore_post_data') 'Unsupported dependency falsely passed'
        }
    }
    Write-Host 'PowerShell integration: PG17.11 synthetic custom/gzip restore, counts, RLS, internal FKs, redaction, unsupported dependency and cleanup passed. Real Windows archive NOT tested.'
}finally{
    [void](Docker @('rm','-f','-v',$container))
    Remove-Item -LiteralPath $temp -Recurse -Force
}
