#Requires -Version 7.2
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$script:Scope = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'application-scope.json') -Raw | ConvertFrom-Json

function Invoke-SjdrProcess {
    param([string]$File, [string[]]$Arguments, [int]$TimeoutSeconds = 120)
    # No shell, no profiles, no interpolation of SQL or credentials. Raw output stays in memory.
    $info = [Diagnostics.ProcessStartInfo]::new()
    $info.FileName = $File
    $info.UseShellExecute = $false
    $info.RedirectStandardOutput = $true
    $info.RedirectStandardError = $true
    foreach ($argument in $Arguments) { [void]$info.ArgumentList.Add($argument) }
    foreach ($key in @('DOCKER_HOST','DOCKER_CONTEXT','DOCKER_TLS','DOCKER_TLS_VERIFY','DOCKER_CERT_PATH','PGPASSWORD','PGPASSFILE','PGSERVICE','PGSERVICEFILE','PGHOST','PGHOSTADDR','PGUSER','PGDATABASE','PGPORT')) { [void]$info.Environment.Remove($key) }
    $info.Environment['PGPASSFILE'] = if ($IsWindows) { 'NUL' } else { '/dev/null' }
    $process = [Diagnostics.Process]::new()
    $process.StartInfo = $info
    try {
        [void]$process.Start()
        $stdout = $process.StandardOutput.ReadToEndAsync()
        $stderr = $process.StandardError.ReadToEndAsync()
        if (-not $process.WaitForExit($TimeoutSeconds * 1000)) {
            $process.Kill($true)
            $process.WaitForExit()
            throw 'native_timeout'
        }
        return @{ code = $process.ExitCode; stdout = $stdout.GetAwaiter().GetResult(); stderr = $stderr.GetAwaiter().GetResult() }
    } finally { $process.Dispose() }
}

function Get-SjdrNativeTools {
    $found = [Collections.Generic.List[object]]::new()
    foreach ($name in @('pg_restore','pg_dump','psql')) {
        $paths = @((Get-Command $name -CommandType Application -All -ErrorAction SilentlyContinue | ForEach-Object Source))
        if ($IsWindows -and $env:ProgramFiles) {
            $paths += @(Get-ChildItem -LiteralPath (Join-Path $env:ProgramFiles 'PostgreSQL') -Directory -ErrorAction SilentlyContinue |
                ForEach-Object { Join-Path $_.FullName ('bin\' + $name + '.exe') } | Where-Object { Test-Path -LiteralPath $_ -PathType Leaf })
        }
        foreach ($path in @($paths | Select-Object -Unique)) {
            $result = Invoke-SjdrProcess -File $path -Arguments @('--version') -TimeoutSeconds 10
            if ($result.code -eq 0 -and $result.stdout -match '(?<version>\d+\.\d+(?:\.\d+)?)') {
                $found.Add(@{ name = $name; version = $Matches.version; path = $path })
            }
        }
    }
    return $found.ToArray()
}

function Get-SjdrLocalDockerHosts {
    # No host/context/DSN parameter exists anywhere in the restore interface.
    if ($IsWindows) { return @('npipe:////./pipe/docker_engine','npipe:////./pipe/dockerDesktopLinuxEngine') }
    return @('unix:///var/run/docker.sock') # Test harness on Linux, always the local socket.
}

function Read-SjdrToc {
    param([string]$Text)
    $entries = [Collections.Generic.List[object]]::new()
    foreach ($line in ($Text -split '\r?\n')) {
        if ($line -match '^(?<id>\d+);\s+\d+\s+\d+\s+(?<kind>FK CONSTRAINT|TABLE DATA|ROW SECURITY|SEQUENCE SET|SEQUENCE OWNED BY|SCHEMA|FUNCTION|TYPE|TABLE|CONSTRAINT|INDEX|POLICY|TRIGGER|DEFAULT|SEQUENCE)\s+(?<schema>\S+)\s+(?<rest>.+)$') {
            $rest = $Matches.rest
            $entries.Add(@{ id = $Matches.id; kind = $Matches.kind; schema = $Matches.schema; name = ($rest -split '\s+')[0]; line = $line })
        }
    }
    $header = @{}
    foreach ($field in @('Format','Compression','TOC Entries','Dumped from database version','Dumped by pg_dump version')) {
        $match = [regex]::Match($Text, '(?m)^;\s*' + [regex]::Escape($field) + ':\s*(.+)\r?$')
        $header[$field] = if ($match.Success) { $match.Groups[1].Value.Trim() } else { $null }
    }
    return @{ header = $header; entries = $entries.ToArray(); listed_entries = @($Text -split '\r?\n' | Where-Object { $_ -match '^\d+;' }).Count }
}

function Select-SjdrApplicationEntries {
    param([object[]]$Entries)
    return @($Entries | Where-Object {
        $entry = $_
        $base = ($entry.name -split '\(')[0]
        if ($entry.kind -eq 'SCHEMA') { $entry.schema -eq '-' -and $entry.name -eq 'private' }
        elseif ($entry.kind -eq 'TYPE') { $entry.schema -eq 'public' -and $base -in $script:Scope.types }
        elseif ($entry.kind -eq 'FUNCTION') {
            ($entry.schema -eq 'public' -and $base -in $script:Scope.public_functions) -or
            ($entry.schema -eq 'private' -and $base -in $script:Scope.private_functions)
        }
        elseif ($entry.kind -in @('INDEX','SEQUENCE','SEQUENCE SET','SEQUENCE OWNED BY')) { $entry.schema -eq 'public' }
        else { $entry.schema -eq 'public' -and $entry.name -in $script:Scope.tables }
    })
}

function Assert-SjdrLocalPath {
    param([string]$Path)
    if (-not [IO.Path]::IsPathFullyQualified($Path) -or $Path.StartsWith('\\') -or $Path -match '[,\r\n]') { throw 'unsafe_local_path' }
    $ancestor = if (Test-Path -LiteralPath $Path -PathType Leaf) { Split-Path -Parent $Path } else { $Path }
    while ($ancestor) {
        if ((Test-Path -LiteralPath (Join-Path $ancestor '.git') -PathType Leaf) -or (Test-Path -LiteralPath (Join-Path $ancestor '.git/HEAD') -PathType Leaf)) { throw 'backup_or_report_inside_git' }
        $parent = Split-Path -Parent $ancestor
        if ($parent -eq $ancestor) { break }
        $ancestor = $parent
    }
}

function Get-SjdrFailureCode {
    param([string]$Message)
    $known = @('unsafe_local_path','backup_or_report_inside_git','backup_not_found','report_directory_must_be_new',
        'backup_size_or_expectation_mismatch','not_custom_pg_dump','docker_desktop_missing',
        'local_docker_linux_engine_unavailable','postgres_start_timeout','unexpected_server_version',
        'archive_header_mismatch','application_tables_missing','unexpected_public_table_inventory',
        'application_table_data_entries_missing','unclassified_foreign_key_dependency',
        'application_integrity_check_failed','restored_object_inventory_mismatch','invalid_aggregate_count',
        'backup_changed_during_validation','native_timeout')
    if ($Message -in $known -or $Message -match '^failed_(pull_image|container_start|server_version|archive_list|extension_inventory|create_database|bootstrap_dependencies|inspect_fk_ddl|restore_pre_data|restore_data|restore_post_data|integrity_metadata|count_table)$') { return $Message }
    return 'unexpected_local_error_details_suppressed'
}

function Invoke-SjdrBackupValidation {
    [CmdletBinding()]
    param([string]$BackupPath, [long]$ExpectedBytes, [int]$ExpectedEntries, [string]$ReportDirectory)
    $id = [Guid]::NewGuid().ToString('N')
    $container = 'sjdr-backup-' + $id
    $database = 'sjdr_restore_' + $id
    $report = [ordered]@{
        status = 'failed'; source = 'local_application_restore'; observed_at = [DateTime]::UtcNow.ToString('o')
        remote_destination_used = $false; real_supabase_homologated = $false
        scope = 'public application tables + known helpers; no managed schema data, owners or ACLs'
        checks = [Collections.Generic.List[object]]::new(); limitations = [Collections.Generic.List[string]]::new()
        native_tools = @(); table_counts = @(); excluded_managed_foreign_keys = 0; cleanup = 'not_started'
    }
    $reportCreated = $false; $work = $null; $docker = $null; $endpoint = $null; $started = $false
    function Docker([string[]]$Arguments, [int]$TimeoutSeconds = 120) {
        Invoke-SjdrProcess -File $docker -Arguments (@('--host', $endpoint) + $Arguments) -TimeoutSeconds $TimeoutSeconds
    }
    function Db([string[]]$Arguments) {
        Docker (@('exec',$container,'env','-u','PGSERVICE','-u','PGPASSWORD','-u','PGHOSTADDR','-u','PGUSER','-u','PGDATABASE','PGHOST=/var/run/postgresql','PGPASSFILE=/dev/null','PGSERVICEFILE=/dev/null') + $Arguments)
    }
    function Check([string]$Stage, [object]$Result) {
        $report.checks.Add(@{ stage = $Stage; exit_code = $Result.code })
        if ($Result.code -ne 0) { throw ('failed_' + $Stage) }
    }
    try {
        $BackupPath = [IO.Path]::GetFullPath($BackupPath)
        Assert-SjdrLocalPath $BackupPath
        if (-not $ReportDirectory) { $ReportDirectory = Join-Path (Split-Path -Parent $BackupPath) ('validacao-' + $id) }
        $ReportDirectory = [IO.Path]::GetFullPath($ReportDirectory)
        Assert-SjdrLocalPath $ReportDirectory
        if (Test-Path -LiteralPath $ReportDirectory) { throw 'report_directory_must_be_new' }
        [void](New-Item -ItemType Directory -Path $ReportDirectory)
        $reportCreated = $true
        if (-not (Test-Path -LiteralPath $BackupPath -PathType Leaf)) { throw 'backup_not_found' }
        $work = Join-Path ([IO.Path]::GetTempPath()) ('sjdr-restore-' + $id)
        Assert-SjdrLocalPath $work
        [void](New-Item -ItemType Directory -Path $work)
        $file = Get-Item -LiteralPath $BackupPath
        if ($file.Length -ne $ExpectedBytes -or $ExpectedBytes -le 0 -or $ExpectedEntries -le 0) { throw 'backup_size_or_expectation_mismatch' }
        $stream = [IO.File]::OpenRead($BackupPath)
        try {
            $magic = [byte[]]::new(5); $read = $stream.Read($magic,0,5)
            if ($read -ne 5 -or [Text.Encoding]::ASCII.GetString($magic) -ne 'PGDMP') { throw 'not_custom_pg_dump' }
        } finally { $stream.Dispose() }
        $report['backup'] = @{ bytes = $file.Length; sha256 = (Get-FileHash -LiteralPath $BackupPath -Algorithm SHA256).Hash; expected_entries = $ExpectedEntries }
        $tools = @(Get-SjdrNativeTools)
        $report.native_tools = @($tools | ForEach-Object { @{name=$_.name; version=$_.version} }) # Never store paths, profiles, environment or passwords.
        $command = Get-Command docker -CommandType Application -ErrorAction SilentlyContinue
        if (-not $command) { throw 'docker_desktop_missing' }
        $docker = $command.Source
        foreach ($candidate in @(Get-SjdrLocalDockerHosts)) {
            $endpoint = $candidate
            $info = Docker @('info','--format','{{.OSType}}') 15
            if ($info.code -eq 0 -and $info.stdout.Trim() -eq 'linux') { break }
            $endpoint = $null
        }
        if (-not $endpoint) { throw 'local_docker_linux_engine_unavailable' }
        # Fixed trusted image, no credentials requested. Pull is the only network operation.
        $image = Docker @('image','inspect','postgres:17.11')
        if ($image.code -ne 0) { Check 'pull_image' (Docker @('pull','postgres:17.11') 300) }
        $started = $true # Cleanup must also handle a container created by a failed docker run.
        $run = Docker @('run','--detach','--name',$container,'--label',('org.descubrasjdr.restore=' + $id),
            '--network','none','--read-only','--log-driver','none',
            '--tmpfs','/var/lib/postgresql/data','--tmpfs','/var/run/postgresql','--tmpfs','/tmp',
            '--mount',('type=bind,src=' + $BackupPath + ',dst=/review/backup.dump,readonly'),
            '--mount',('type=bind,src=' + $work + ',dst=/review/work,readonly'),
            '--env','POSTGRES_HOST_AUTH_METHOD=trust','postgres:17.11',
            'postgres','-c','listen_addresses=','-c','log_min_messages=panic','-c','log_min_error_statement=panic',
            '-c','log_error_verbosity=terse','-c','log_statement=none')
        Check 'container_start' $run
        $started = $true
        $ready = $false
        for ($i=0; $i -lt 60; $i++) {
            $pid1 = Docker @('exec',$container,'cat','/proc/1/comm')
            if ($pid1.code -eq 0 -and $pid1.stdout.Trim() -eq 'postgres') {
                $ping = Db @('pg_isready','-U','postgres')
                if ($ping.code -eq 0) { $ready=$true; break }
            }
            Start-Sleep -Milliseconds 500
        }
        if (-not $ready) { throw 'postgres_start_timeout' }
        $version = Db @('psql','-X','-w','-U','postgres','-d','postgres','-Atc','show server_version')
        Check 'server_version' $version
        if ($version.stdout.Trim() -notmatch '^17\.11(?:\D|$)') { throw 'unexpected_server_version' }
        $report['postgres_version'] = '17.11'
        # pg_restore inside this image is always available; detected native Windows tools are optional.
        $native = @($tools | Where-Object { $_.name -eq 'pg_restore' -and $_.version -eq '17.11' })
        $listing = if ($native.Count) { Invoke-SjdrProcess -File $native[0].path -Arguments @('--list','--no-password',$BackupPath) } else { Db @('pg_restore','--list','/review/backup.dump') }
        Check 'archive_list' $listing
        $toc = Read-SjdrToc $listing.stdout
        if ($toc.header.Format -ne 'CUSTOM' -or $toc.header.Compression -ne 'gzip' -or [int]$toc.header.'TOC Entries' -ne $ExpectedEntries -or
            $toc.header.'Dumped from database version' -notmatch '^17\.11(?:\D|$)' -or $toc.header.'Dumped by pg_dump version' -notmatch '^17\.11(?:\D|$)') { throw 'archive_header_mismatch' }
        $report['archive'] = @{ format='CUSTOM'; compression='gzip'; toc_entries=[int]$toc.header.'TOC Entries'; listed_entries=$toc.listed_entries }
        $selected = @(Select-SjdrApplicationEntries $toc.entries)
        $allPublicTables = @($toc.entries | Where-Object { $_.kind -eq 'TABLE' -and $_.schema -eq 'public' })
        if ($allPublicTables.Count -ne 29 -or @($allPublicTables | Where-Object { $_.name -notin $script:Scope.tables }).Count) { throw 'unexpected_public_table_inventory' }
        $tables = @($selected | Where-Object kind -eq 'TABLE' | ForEach-Object name | Sort-Object -Unique)
        if (@($script:Scope.tables | Where-Object { $_ -notin $tables }).Count -or $tables.Count -ne 29) { throw 'application_tables_missing' }
        $dataTables = @($selected | Where-Object kind -eq 'TABLE DATA' | ForEach-Object name | Sort-Object -Unique)
        if (@($script:Scope.tables | Where-Object { $_ -notin $dataTables }).Count -or $dataTables.Count -ne 29) { throw 'application_table_data_entries_missing' }
        $report['selected_toc_entries'] = $selected.Count
        $report['excluded_toc_entries'] = $toc.listed_entries - $selected.Count
        $report.limitations.Add('Dados de auth, storage, vault e demais schemas gerenciados excluidos; sem senhas/hashes de auth.users, roles globais ou objetos binarios do Storage.')
        $report.limitations.Add('Owners e ACLs originais nao restaurados; roles locais NOLOGIN e auth.uid() retornando NULL servem somente para dependencias. Nao validam Auth/RLS autenticada real.')
        $report.limitations.Add('Contagens locais nao foram comparadas com contagens do Cloud; pg_dump exit 0 e lista do arquivo nao comprovam recuperacao integral do Supabase.')
        $extensions = @($listing.stdout -split '\r?\n' | Where-Object { $_ -match '^\d+;\s+\d+\s+\d+\s+EXTENSION\s' }).Count
        $report['archive_extension_entries'] = $extensions
        $extensionNames = @($listing.stdout -split '\r?\n' | ForEach-Object {
            if ($_ -match '^\d+;\s+\d+\s+\d+\s+EXTENSION\s+-\s+(?<ext>[A-Za-z0-9_-]+)(?:\s|$)') { $Matches.ext }
        })
        $available = Db @('psql','-X','-w','-U','postgres','-d','postgres','-Atc',"select coalesce(json_agg(name),'[]'::json) from pg_available_extensions")
        Check 'extension_inventory' $available
        $availableNames = @($available.stdout | ConvertFrom-Json)
        $report['extensions'] = @($extensionNames | ForEach-Object { @{name=$_;available_in_plain_postgres=($_ -in $availableNames);restored_from_dump=$false} })
        $report.limitations.Add('Extensoes do dump nao sao instaladas automaticamente. Somente pgcrypto local e preparado; dependencias indisponiveis causam falha, sem substituir objetos de producao.')
        $bootstrap = @'
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema auth;
create function auth.uid() returns uuid language sql stable as 'select null::uuid';
grant usage on schema auth to anon,authenticated,service_role;
grant execute on function auth.uid() to anon,authenticated,service_role;
create extension if not exists pgcrypto;
'@
        [IO.File]::WriteAllText((Join-Path $work 'bootstrap.sql'),$bootstrap)
        Check 'create_database' (Db @('createdb','-w','-U','postgres','--template=template0',$database))
        Check 'bootstrap_dependencies' (Db @('psql','-X','-w','-U','postgres','-d',$database,'-v','ON_ERROR_STOP=1','-f','/review/work/bootstrap.sql'))
        # Determine external FK dependencies from DDL ONLY, never from table data or auth rows.
        $external = [Collections.Generic.List[string]]::new()
        foreach ($fk in @($selected | Where-Object kind -eq 'FK CONSTRAINT')) {
            [IO.File]::WriteAllText((Join-Path $work 'fk.list'),$fk.line + "`n")
            $ddl = Db @('pg_restore','--schema-only','--no-owner','--no-privileges','--use-list=/review/work/fk.list','--file=-','/review/backup.dump')
            Check 'inspect_fk_ddl' $ddl
            if ($ddl.stdout -match '(?i)REFERENCES\s+(?:"?(?:auth|storage|vault)"?)\s*\.') { $external.Add($fk.id) }
            elseif ($ddl.stdout -notmatch '(?i)REFERENCES\s+"?public"?\s*\.') { throw 'unclassified_foreign_key_dependency' }
        }
        $report.excluded_managed_foreign_keys = $external.Count
        $report.limitations.Add('FKs da aplicacao para schemas gerenciados foram excluidas do ensaio; integridade contra identidades/servicos reais nao foi validada.')
        $final = @($selected | Where-Object { $_.id -notin $external })
        [IO.File]::WriteAllLines((Join-Path $work 'application.list'),[string[]]@($final | ForEach-Object line))
        foreach ($section in @('pre-data','data','post-data')) {
            Check ('restore_' + $section.Replace('-','_')) (Db @('pg_restore','--exit-on-error','--no-password','--no-owner','--no-privileges',('--section=' + $section),'--use-list=/review/work/application.list','-U','postgres',('--dbname=' + $database),'/review/backup.dump'))
        }
        $audit = @'
select json_build_object(
 'tables',(select json_agg(json_build_object('name',c.relname,'rls',c.relrowsecurity) order by c.relname) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r'),
 'invalid_constraints',(select count(*) from pg_constraint k join pg_namespace n on n.oid=k.connamespace where n.nspname='public' and not k.convalidated),
 'policies',(select count(*) from pg_policies where schemaname='public'),
 'triggers',(select count(*) from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and not t.tgisinternal),
 'indexes',(select coalesce(json_agg(indexname),'[]'::json) from pg_indexes where schemaname='public'),
 'foreign_keys',(select count(*) from pg_constraint k join pg_namespace n on n.oid=k.connamespace where n.nspname='public' and k.contype='f'),
 'auth_users_restored',to_regclass('auth.users') is not null
);
'@
        [IO.File]::WriteAllText((Join-Path $work 'audit.sql'),$audit)
        $state = Db @('psql','-X','-w','-U','postgres','-d',$database,'-v','ON_ERROR_STOP=1','-Atf','/review/work/audit.sql')
        Check 'integrity_metadata' $state
        $metadata = $state.stdout | ConvertFrom-Json
        if (@($metadata.tables).Count -ne 29 -or @($metadata.tables | Where-Object { -not $_.rls }).Count -or $metadata.invalid_constraints -ne 0 -or $metadata.auth_users_restored) { throw 'application_integrity_check_failed' }
        $expectedFks = @($final | Where-Object kind -eq 'FK CONSTRAINT').Count
        $expectedPolicies = @($final | Where-Object kind -eq 'POLICY').Count
        $expectedTriggers = @($final | Where-Object kind -eq 'TRIGGER').Count
        $expectedIndexes = @($final | Where-Object kind -eq 'INDEX' | ForEach-Object name)
        if ($metadata.foreign_keys -ne $expectedFks -or $metadata.policies -ne $expectedPolicies -or $metadata.triggers -ne $expectedTriggers -or @($expectedIndexes | Where-Object { $_ -notin $metadata.indexes }).Count) { throw 'restored_object_inventory_mismatch' }
        $report['integrity'] = $metadata
        foreach ($table in $script:Scope.tables) {
            # Table identifiers come exclusively from the versioned allowlist, not user/backup values.
            $count = Db @('psql','-X','-w','-U','postgres','-d',$database,'-Atc',('select count(*) from public.' + $table))
            Check 'count_table' $count
            if ($count.stdout.Trim() -notmatch '^\d+$') { throw 'invalid_aggregate_count' }
            $report.table_counts += @{ table=$table; rows=[long]$count.stdout.Trim() }
        }
        if ((Get-FileHash -LiteralPath $BackupPath -Algorithm SHA256).Hash -ne $report.backup.sha256) { throw 'backup_changed_during_validation' }
        $report.status = 'application_restored_with_limitations'
    } catch {
        # Exception/native error text may contain COPY row contents, paths, SQL or credentials. Never export it.
        $code = [string]$_.Exception.Message
        $report['failure'] = Get-SjdrFailureCode $code
    } finally {
        if ($started) {
            try {
                $owner = Docker @('inspect','--format','{{ index .Config.Labels "org.descubrasjdr.restore" }}',$container)
                if ($owner.code -eq 0 -and $owner.stdout.Trim() -eq $id) {
                    $removed = Docker @('rm','--force','--volumes',$container)
                    $report.cleanup = if ($removed.code -eq 0) { 'removed' } else { 'failed' }
                } else { $report.cleanup = 'unverified_not_removed' }
            } catch { $report.cleanup = 'failed' }
            if ($report.cleanup -ne 'removed') { $report.status='failed'; $report['cleanup_container']=$container }
        }
        if ($work -and (Test-Path -LiteralPath $work)) {
            try { Remove-Item -LiteralPath $work -Recurse -Force } catch { $report.status='failed'; $report['temporary_metadata_cleanup']='failed' }
        }
    }
    if (-not $reportCreated -or -not $ReportDirectory -or -not (Test-Path -LiteralPath $ReportDirectory -PathType Container)) { throw ('Nao foi possivel criar o relatorio local. Codigo seguro: ' + $report.failure) }
    $path = Join-Path $ReportDirectory 'resultado.json'
    $report | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $path -Encoding utf8
    $summary = @('Descubra SJDR - ensaio local de restauracao',('Status: ' + $report.status),('Limpeza: ' + $report.cleanup),'Somente recorte da aplicacao; nao e homologacao de recuperacao integral do Supabase.','Ver resultado.json. Nao compartilhar dump, dados ou saidas brutas.')
    $summary | Set-Content -LiteralPath (Join-Path $ReportDirectory 'LEIA-ME.txt') -Encoding utf8
    return @{ status=$report.status; report_path=$path }
}
Export-ModuleMember -Function Invoke-SjdrBackupValidation,Read-SjdrToc,Select-SjdrApplicationEntries,Get-SjdrLocalDockerHosts,Assert-SjdrLocalPath,Get-SjdrFailureCode
