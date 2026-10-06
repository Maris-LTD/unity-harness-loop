param(
  [Parameter(Mandatory = $true)][int]$UnityPid,
  [int]$OwnerPid = 0,
  [int]$Seconds = 300,
  [int]$IntervalMs = 1000
)

Add-Type -Namespace HarnessFocus -Name Win32 -MemberDefinition @'
[DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
[DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
[DllImport("user32.dll")] public static extern bool IsIconic(IntPtr hWnd);
[DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
[DllImport("user32.dll")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);
'@

$AltKey = 0x12
$KeyUp = 0x2
$deadline = (Get-Date).AddSeconds($Seconds)

function Get-UnityWindow {
  $process = Get-Process -Id $UnityPid -ErrorAction SilentlyContinue
  if ($null -eq $process) { return [IntPtr]::Zero }
  return $process.MainWindowHandle
}

function Set-UnityForeground([IntPtr]$handle) {
  if ([HarnessFocus.Win32]::GetForegroundWindow() -eq $handle) { return }
  if ([HarnessFocus.Win32]::IsIconic($handle)) { [void][HarnessFocus.Win32]::ShowWindow($handle, 9) }
  [HarnessFocus.Win32]::keybd_event($AltKey, 0, 0, [UIntPtr]::Zero)
  [void][HarnessFocus.Win32]::SetForegroundWindow($handle)
  [HarnessFocus.Win32]::keybd_event($AltKey, 0, $KeyUp, [UIntPtr]::Zero)
}

while ((Get-Date) -lt $deadline) {
  if ($OwnerPid -gt 0 -and $null -eq (Get-Process -Id $OwnerPid -ErrorAction SilentlyContinue)) { break }
  $handle = Get-UnityWindow
  if ($handle -eq [IntPtr]::Zero) { break }
  Set-UnityForeground $handle
  Start-Sleep -Milliseconds $IntervalMs
}
