[CmdletBinding()]
param(
    [string]$ManifestPath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if (-not $ManifestPath) {
    $ManifestPath = Join-Path (Split-Path -Parent $PSScriptRoot) 'manifests\source-allowlist.json'
}

$allowedActions = @(
    'COPY',
    'ADAPT',
    'MERGE_REFERENCE',
    'REWRITE_REFERENCE',
    'PENDING_PHASE_3',
    'EXCLUDE_DUPLICATE_PUBLIC',
    'EXCLUDE_LEGACY_EDITORIAL',
    'EXCLUDE_PERSISTENCE',
    'EXCLUDE_OPERATIONAL',
    'EXCLUDE_OBSOLETE_DOCUMENTATION',
    'EXCLUDE_MOCK_PRODUCTION',
    'EXCLUDE_UNUSED_UI',
    'EXCLUDE_GENERATED_LOCKFILE',
    'EXCLUDE_OLD_PACKAGING',
    'EXCLUDE_REMOTE_ASSET',
    'EXCLUDE_PRIVATE_DATASET'
)

function Assert-Condition {
    param(
        [bool]$Condition,
        [string]$Message
    )

    if (-not $Condition) {
        throw $Message
    }
}

function Invoke-GitHubJson {
    param(
        [string]$Endpoint,
        [string]$SourceRole
    )

    $output = & gh api $Endpoint 2>$null | Out-String
    if ($LASTEXITCODE -ne 0) {
        throw "GitHub API metadata query failed for source role '$SourceRole'."
    }
    try {
        return $output | ConvertFrom-Json
    }
    catch {
        throw "GitHub API returned invalid metadata for source role '$SourceRole'."
    }
}

function Get-ActionCounts {
    param([object[]]$Items)

    $counts = @{}
    foreach ($group in ($Items | Group-Object -Property action)) {
        $counts[$group.Name] = $group.Count
    }
    return $counts
}

function Assert-DeclaredCounts {
    param(
        [hashtable]$Actual,
        [object]$Declared,
        [string]$Label
    )

    $declaredNames = @($Declared.PSObject.Properties.Name)
    Assert-Condition ($declaredNames.Count -eq $Actual.Count) "$Label action keys do not match computed counts."
    foreach ($name in $Actual.Keys) {
        Assert-Condition ($declaredNames -contains $name) "$Label is missing action '$name'."
        Assert-Condition ([int]$Declared.$name -eq [int]$Actual[$name]) "$Label count mismatch for action '$name'."
    }
}

try {
    Assert-Condition (Test-Path -LiteralPath $ManifestPath -PathType Leaf) 'Allowlist manifest was not found.'
    Assert-Condition ($null -ne (Get-Command gh -ErrorAction SilentlyContinue)) 'GitHub CLI (gh) is required.'

    $manifest = Get-Content -LiteralPath $ManifestPath -Raw -Encoding utf8 | ConvertFrom-Json
    Assert-Condition ($manifest.schema_version -eq 1) 'Unsupported schema_version.'
    Assert-Condition ($manifest.status -eq 'PASS') 'Manifest status is not PASS.'
    Assert-Condition ($manifest.policy.unknown_allowed -eq $false) 'Manifest must forbid UNKNOWN classifications.'

    $declaredActions = @($manifest.policy.allowed_actions)
    Assert-Condition ($declaredActions.Count -eq $allowedActions.Count) 'Declared action set differs from validator action set.'
    foreach ($action in $allowedActions) {
        Assert-Condition ($declaredActions -contains $action) "Declared action set is missing '$action'."
    }

    $entries = @($manifest.entries)
    $externalAssets = @($manifest.external_assets)
    Assert-Condition ($entries.Count -eq [int]$manifest.summary.tracked_blob_count) 'Tracked entry total differs from summary.'
    Assert-Condition ($externalAssets.Count -eq [int]$manifest.summary.external_asset_count) 'External asset total differs from summary.'

    foreach ($entry in $entries) {
        Assert-Condition ($allowedActions -contains [string]$entry.action) "Invalid action for tracked source path '$($entry.source_path)'."
        Assert-Condition (-not ([string]$entry.action).Contains('UNKNOWN')) "UNKNOWN action found for tracked source path '$($entry.source_path)'."
        Assert-Condition (-not [string]::IsNullOrWhiteSpace([string]$entry.reason)) "Missing reason for tracked source path '$($entry.source_path)'."
        Assert-Condition ([string]$entry.source_blob_sha -match '^[0-9a-f]{40}$') "Invalid blob SHA for tracked source path '$($entry.source_path)'."
        if (([string]$entry.action).StartsWith('EXCLUDE_')) {
            Assert-Condition ($null -eq $entry.target_path) "Excluded tracked source path '$($entry.source_path)' must not have a target_path."
            Assert-Condition ([int]$entry.phase -eq 1) "Excluded tracked source path '$($entry.source_path)' must be classified in Phase 1."
        }
        elseif ($entry.action -eq 'PENDING_PHASE_3') {
            Assert-Condition (-not [string]::IsNullOrWhiteSpace([string]$entry.target_path)) "Pending tracked source path '$($entry.source_path)' needs a target_path."
            Assert-Condition ([int]$entry.phase -eq 3) "Pending tracked source path '$($entry.source_path)' must be Phase 3."
        }
        else {
            Assert-Condition (-not [string]::IsNullOrWhiteSpace([string]$entry.target_path)) "Included tracked source path '$($entry.source_path)' needs a target_path."
            Assert-Condition ([int]$entry.phase -eq 2) "Included tracked source path '$($entry.source_path)' must be Phase 2."
        }
    }

    foreach ($asset in $externalAssets) {
        Assert-Condition ($asset.source_role -eq 'external_assets') "External item '$($asset.source_path)' has an invalid source_role."
        Assert-Condition ($null -eq $asset.source_blob_sha) "External item '$($asset.source_path)' must not invent a blob SHA."
        Assert-Condition ($allowedActions -contains [string]$asset.action) "External item '$($asset.source_path)' has an invalid action."
        Assert-Condition (-not ([string]$asset.action).Contains('UNKNOWN')) "External item '$($asset.source_path)' is UNKNOWN."
        Assert-Condition (-not [string]::IsNullOrWhiteSpace([string]$asset.reason)) "External item '$($asset.source_path)' has no reason."
        if ($asset.action -eq 'PENDING_PHASE_3') {
            Assert-Condition ([int]$asset.phase -eq 3) "External item '$($asset.source_path)' must wait for Phase 3."
            Assert-Condition (-not [string]::IsNullOrWhiteSpace([string]$asset.target_path)) "External pending item '$($asset.source_path)' needs a target_path."
        }
        else {
            Assert-Condition (([string]$asset.action).StartsWith('EXCLUDE_')) "External item '$($asset.source_path)' must be pending or explicitly excluded."
            Assert-Condition ([int]$asset.phase -eq 1) "Excluded external item '$($asset.source_path)' must be Phase 1."
            Assert-Condition ($null -eq $asset.target_path) "Excluded external item '$($asset.source_path)' must not have a target_path."
        }
    }

    $treesByRole = @{}
    foreach ($source in @($manifest.source_set)) {
        $role = [string]$source.role
        Assert-Condition ([string]$source.commit_sha -match '^[0-9a-f]{40}$') "Invalid source commit SHA for '$role'."
        Assert-Condition ([string]$source.tree_sha -match '^[0-9a-f]{40}$') "Invalid source tree SHA for '$role'."

        $commit = Invoke-GitHubJson "repos/$($source.repository)/git/commits/$($source.commit_sha)" $role
        Assert-Condition ($commit.sha -eq $source.commit_sha) "Source commit mismatch for '$role'."
        Assert-Condition ($commit.tree.sha -eq $source.tree_sha) "Source tree mismatch for '$role'."

        $tree = Invoke-GitHubJson "repos/$($source.repository)/git/trees/$($source.tree_sha)?recursive=1" $role
        Assert-Condition ($tree.truncated -eq $false) "Recursive tree is truncated for '$role'."
        $blobs = @($tree.tree | Where-Object type -eq 'blob')
        Assert-Condition ($blobs.Count -eq [int]$source.expected_blob_count) "Remote blob count mismatch for '$role'."

        $sourceEntries = @($entries | Where-Object source_role -eq $role)
        Assert-Condition ($sourceEntries.Count -eq $blobs.Count) "Manifest coverage count mismatch for '$role'."
        Assert-Condition (($sourceEntries.source_path | Sort-Object -Unique).Count -eq $sourceEntries.Count) "Duplicate source_path classification for '$role'."

        $entryByPath = @{}
        foreach ($entry in $sourceEntries) { $entryByPath[[string]$entry.source_path] = $entry }
        $blobByPath = @{}
        foreach ($blob in $blobs) { $blobByPath[[string]$blob.path] = $blob }

        foreach ($blob in $blobs) {
            Assert-Condition ($entryByPath.ContainsKey([string]$blob.path)) "Unclassified tracked blob in '$role'."
            Assert-Condition ($entryByPath[[string]$blob.path].source_blob_sha -eq $blob.sha) "Blob SHA mismatch in '$role' for '$($blob.path)'."
        }
        foreach ($entry in $sourceEntries) {
            Assert-Condition ($blobByPath.ContainsKey([string]$entry.source_path)) "Manifest path is absent from frozen tree '$role'."
        }

        $declaredSourceCount = [int]$manifest.summary.tracked_blob_count_by_source.$role
        Assert-Condition ($declaredSourceCount -eq $blobs.Count) "Summary source count mismatch for '$role'."
        $treesByRole[$role] = $blobByPath
        Write-Host ("Verified {0}: {1} blobs, commit {2}, tree {3}" -f $role, $blobs.Count, $source.commit_sha, $source.tree_sha)
    }

    Assert-Condition ($treesByRole.ContainsKey('public_product')) 'Public source role is missing.'
    Assert-Condition ($treesByRole.ContainsKey('private_capability')) 'Private source role is missing.'
    $publicTree = $treesByRole['public_product']
    $privateTree = $treesByRole['private_capability']
    $privateEntries = @{}
    foreach ($entry in ($entries | Where-Object source_role -eq 'private_capability')) {
        $privateEntries[[string]$entry.source_path] = $entry
    }
    foreach ($path in $privateTree.Keys) {
        $isDuplicate = $publicTree.ContainsKey($path) -and $publicTree[$path].sha -eq $privateTree[$path].sha
        if ($isDuplicate) {
            Assert-Condition ($privateEntries[$path].action -eq 'EXCLUDE_DUPLICATE_PUBLIC') "Identical private blob '$path' is not excluded as a public duplicate."
        }
        elseif ($privateEntries[$path].action -eq 'EXCLUDE_DUPLICATE_PUBLIC') {
            throw "Private blob '$path' is marked duplicate but is not byte-identical to the public path."
        }
    }

    $allTargeted = @($entries + $externalAssets | Where-Object { -not [string]::IsNullOrWhiteSpace([string]$_.target_path) })
    $conflicts = @($allTargeted | Group-Object -Property target_path | Where-Object Count -gt 1)
    foreach ($conflict in $conflicts) {
        $actions = @($conflict.Group.action | Sort-Object -Unique)
        foreach ($action in $actions) {
            Assert-Condition ($action -in @('MERGE_REFERENCE', 'REWRITE_REFERENCE')) "Invalid target conflict at '$($conflict.Name)'."
        }
    }

    $trackedCounts = Get-ActionCounts $entries
    $externalCounts = Get-ActionCounts $externalAssets
    Assert-DeclaredCounts $trackedCounts $manifest.summary.tracked_counts_by_action 'Tracked summary'
    Assert-DeclaredCounts $externalCounts $manifest.summary.external_counts_by_action 'External summary'

    Write-Host ("Verified coverage: {0} tracked blobs; 0 missing; 0 extra; 0 UNKNOWN." -f $entries.Count)
    Write-Host ("Verified target conflicts: {0}; all are explicit merge/rewrite references." -f $conflicts.Count)
    foreach ($action in ($trackedCounts.Keys | Sort-Object)) {
        Write-Host ("  {0}: {1}" -f $action, $trackedCounts[$action])
    }
    Write-Host ("Verified external assets: {0}; no blob SHAs invented." -f $externalAssets.Count)
    Write-Host 'Gate: PASS'
}
catch {
    Write-Error ("Gate: FAIL - {0}" -f $_.Exception.Message)
    exit 1
}
