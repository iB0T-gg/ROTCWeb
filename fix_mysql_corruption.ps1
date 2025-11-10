# MySQL/MariaDB Corruption Recovery Script
# Run this script as Administrator

Write-Host "MySQL/MariaDB Corruption Recovery Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "WARNING: Not running as Administrator. Some operations may fail." -ForegroundColor Yellow
    Write-Host ""
}

$mysqlDataPath = "C:\xampp\mysql\data"
$mysqlConfigPath = "C:\xampp\mysql\bin\my.ini"

# Check if paths exist
if (-not (Test-Path $mysqlDataPath)) {
    Write-Host "ERROR: MySQL data directory not found at $mysqlDataPath" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $mysqlConfigPath)) {
    Write-Host "ERROR: MySQL config file not found at $mysqlConfigPath" -ForegroundColor Red
    exit 1
}

Write-Host "Step 1: Checking MySQL service status..." -ForegroundColor Green
$mysqlService = Get-Service -Name "*mysql*" -ErrorAction SilentlyContinue
if ($mysqlService) {
    Write-Host "MySQL service found: $($mysqlService.Name) - Status: $($mysqlService.Status)" -ForegroundColor Yellow
    if ($mysqlService.Status -eq "Running") {
        Write-Host "MySQL is running. Please stop it from XAMPP Control Panel first." -ForegroundColor Yellow
        Write-Host ""
    }
} else {
    Write-Host "No MySQL Windows service found (using XAMPP control panel)" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "Step 2: Checking disk space..." -ForegroundColor Green
$drive = (Get-Item $mysqlDataPath).PSDrive.Name
$driveInfo = Get-PSDrive $drive
$freeSpaceGB = [math]::Round($driveInfo.Free / 1GB, 2)
Write-Host "Free space on drive $drive : $freeSpaceGB GB" -ForegroundColor $(if ($freeSpaceGB -lt 1) { "Red" } else { "Green" })
if ($freeSpaceGB -lt 1) {
    Write-Host "WARNING: Low disk space may cause MySQL issues!" -ForegroundColor Red
}
Write-Host ""

Write-Host "Step 3: Checking for corrupted InnoDB files..." -ForegroundColor Green
$innodbFiles = @("ibdata1", "ib_logfile0", "ib_logfile1", "ibtmp1")
foreach ($file in $innodbFiles) {
    $filePath = Join-Path $mysqlDataPath $file
    if (Test-Path $filePath) {
        $fileSize = (Get-Item $filePath).Length / 1MB
        Write-Host "  Found: $file ($([math]::Round($fileSize, 2)) MB)" -ForegroundColor Yellow
    } else {
        Write-Host "  Not found: $file" -ForegroundColor Gray
    }
}
Write-Host ""

Write-Host "Step 4: Checking MySQL configuration..." -ForegroundColor Green
$configContent = Get-Content $mysqlConfigPath -Raw
if ($configContent -match "innodb_force_recovery\s*=\s*(\d+)") {
    $recoveryLevel = $matches[1]
    Write-Host "  Current recovery mode: $recoveryLevel" -ForegroundColor Yellow
    if ([int]$recoveryLevel -lt 6) {
        Write-Host "  Suggestion: Try increasing recovery mode to $([int]$recoveryLevel + 1)" -ForegroundColor Cyan
    } else {
        Write-Host "  Already at maximum recovery mode (6)" -ForegroundColor Yellow
    }
} else {
    Write-Host "  No recovery mode set" -ForegroundColor Yellow
    Write-Host "  Suggestion: Add 'innodb_force_recovery = 2' to [mysqld] section" -ForegroundColor Cyan
}
Write-Host ""

Write-Host "Step 5: Checking port 3306..." -ForegroundColor Green
$portCheck = netstat -ano | findstr ":3306"
if ($portCheck) {
    Write-Host "  Port 3306 is in use:" -ForegroundColor Yellow
    Write-Host $portCheck -ForegroundColor Gray
} else {
    Write-Host "  Port 3306 is available" -ForegroundColor Green
}
Write-Host ""

Write-Host "RECOMMENDED ACTIONS:" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Stop MySQL from XAMPP Control Panel" -ForegroundColor White
Write-Host "2. The recovery mode has been set to 2 in my.ini" -ForegroundColor White
Write-Host "3. Start MySQL and check if it starts successfully" -ForegroundColor White
Write-Host "4. If it starts, immediately backup your database:" -ForegroundColor White
Write-Host "   mysqldump -u root -p rotc_db > backup_rotc_db.sql" -ForegroundColor Gray
Write-Host "5. If recovery mode 2 doesn't work, increase to 3, 4, 5, or 6" -ForegroundColor White
Write-Host "6. After successful recovery, remove 'innodb_force_recovery' line from my.ini" -ForegroundColor White
Write-Host ""
Write-Host "For detailed instructions, see: ROTCWeb/MYSQL_RECOVERY_GUIDE.md" -ForegroundColor Cyan
Write-Host ""

