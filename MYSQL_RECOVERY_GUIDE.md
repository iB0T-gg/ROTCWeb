# MySQL/MariaDB Recovery Guide

## Problem
InnoDB assertion failure indicating potential tablespace corruption:
```
InnoDB: Assertion failure in file D:\winx64-packages\build\src\storage\innobase\os\os0file.cc line 6132
InnoDB: Failing assertion: slot
```

## Recovery Steps (Try in Order)

### Step 1: Try Recovery Mode 2
If recovery mode 1 doesn't work, try mode 2 (read-only mode):
- Edit `C:\xampp\mysql\bin\my.ini`
- Change `innodb_force_recovery = 1` to `innodb_force_recovery = 2`
- Restart MySQL
- Try to access database and export data

### Step 2: Try Recovery Mode 3
If mode 2 doesn't work:
- Change to `innodb_force_recovery = 3`
- Restart MySQL
- Export data (database will be read-only)

### Step 3: Try Recovery Mode 4
If mode 3 doesn't work:
- Change to `innodb_force_recovery = 4`
- Restart MySQL
- Export data

### Step 4: Check for Corrupted Tables
Once MySQL starts, check for corrupted tables:
```sql
CHECK TABLE table_name;
```

### Step 5: Export Data
If MySQL starts in recovery mode, export your data:
```bash
mysqldump -u root -p rotc_db > backup_rotc_db.sql
```

### Step 6: Rebuild Database
If recovery works and you've exported data:
1. Stop MySQL
2. Remove `innodb_force_recovery` line from my.ini
3. Delete corrupted InnoDB files (BACKUP FIRST!):
   - `ibdata1`
   - `ib_logfile0`
   - `ib_logfile1`
4. Restart MySQL
5. Recreate database and import backup

## Recovery Mode Levels

- **Level 1 (SRV_FORCE_IGNORE_CORRUPT)**: Ignore corrupted pages
- **Level 2 (SRV_FORCE_NO_BACKGROUND)**: Prevent master thread from running
- **Level 3 (SRV_FORCE_NO_TRX_UNDO)**: Don't run transaction rollbacks
- **Level 4 (SRV_FORCE_NO_IBUF_MERGE)**: Don't insert buffer merge operations
- **Level 5 (SRV_FORCE_NO_UNDO_LOG_SCAN)**: Don't look at undo logs
- **Level 6 (SRV_FORCE_NO_LOG_REDO)**: Don't do redo log roll-forward

**Important**: Higher levels are more restrictive (read-only) but can recover more corrupted data.

## Alternative: Fresh Start (If No Critical Data)

If you don't have critical data or have backups:
1. Stop MySQL
2. Backup `C:\xampp\mysql\data` folder
3. Delete InnoDB files:
   - `ibdata1`
   - `ib_logfile0`
   - `ib_logfile1`
   - `ibtmp1`
4. Remove `innodb_force_recovery` from my.ini
5. Restart MySQL
6. Recreate database using Laravel migrations

## Prevention

1. Regular backups
2. Proper shutdown (don't force kill MySQL)
3. Sufficient disk space
4. Check disk for errors

