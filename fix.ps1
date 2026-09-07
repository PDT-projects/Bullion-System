$path = "src\modules\user-management\views\UserManagement.tsx"
$lines = Get-Content $path

$insertAfter = "} from '../models/userService';"
$newLines = New-Object System.Collections.Generic.List[string]

foreach ($line in $lines) {
    $newLines.Add($line)
    if ($line.Trim() -eq $insertAfter) {
        $newLines.Add("")
        $newLines.Add("async function approveUser(uid: string, branch: string, permissions: Screen[], approvedBy: string) {")
        $newLines.Add("  await updateUserPermissions(uid, permissions, approvedBy);")
        $newLines.Add("  await updateUserBranch(uid, branch, approvedBy);")
        $newLines.Add("}")
        $newLines.Add("async function rejectUser(uid: string, rejectedBy: string) {")
        $newLines.Add("  await deleteUser(uid);")
        $newLines.Add("}")
    }
}

Set-Content $path $newLines
Write-Host "Done."