# Deli Fingerprint Scanner Import Guide

## Overview
This system allows you to import attendance data directly from Deli fingerprint scanner export files into the ROTC attendance system. The imported data will automatically be mapped to weekly attendance records and stored in the appropriate semester tables.

## Supported File Formats
- **CSV** (.csv)
- **TXT** (.txt) - Tab or comma separated
- **Excel** (.xlsx, .xls)

## Required File Structure

### Column Headers (Case Insensitive)
The import system looks for these column patterns:

1. **User ID Column** (Required)
   - Accepted headers: `UserID`, `User_ID`, `User ID`, `ID`, `Employee_ID`, `Emp_ID`
   - Should contain student numbers or user IDs from your system

2. **Date Column** (Required)
   - Accepted headers: `Date`, `Attendance_Date`, `Check_Date`, `Scan_Date`, `Timestamp`
   - Supported formats: `YYYY-MM-DD`, `MM/DD/YYYY`, `DD/MM/YYYY`, `YYYY/MM/DD`

3. **Time Column** (Optional)
   - Accepted headers: `Time`, `Check_Time`, `Scan_Time`, `Clock_Time`
   - Used for logging but not required for attendance calculation

### Example File Format

#### CSV Format
```csv
UserID,Date,Time
23123456,2025-10-01,08:30:00
23123457,2025-10-01,08:35:15
23123456,2025-10-08,08:25:30
```

*Note: UserID shows 8-digit numbers from Deli scanner that match the last 8 digits of 10-digit student numbers*

#### Alternative Format
```csv
Employee_ID,Check_Date,Check_Time
23001001,10/01/2025,8:30 AM
23001002,10/01/2025,8:35 AM
```

## How It Works

### 1. Semester Detection
- **1st Semester**: Dates starting from August 15th
- **2nd Semester**: Dates starting from January 15th
- System automatically maps dates to correct semester weeks (1-15)

### 2. Week Calculation
- Week 1 starts on the semester start date
- Each subsequent week is calculated based on date difference
- Only weeks 1-15 are accepted (beyond that will be ignored)

### 3. User Matching
The system matches users by:
1. **Student Number** (primary match)
   - First tries exact match with Deli scanner UserID
   - For 10-digit student numbers: Removes first 2 digits to match 8-digit Deli scanner IDs
   - Example: Student number `2023123456` matches Deli ID `23123456`
2. **User ID** (fallback for direct database ID matches)
3. **Padded Matching**: Handles Deli IDs with leading zeros removed
4. Only matches users with role 'user' (excludes admins)

### 4. Data Storage
- **1st Semester**: Stored in `first_semester_attendance` table
- **2nd Semester**: Stored in `second_semester_attendance` table
- Each user gets one record per semester with 15 weekly boolean columns
- Attendance percentage is automatically calculated

## Import Process

### Step 1: Access Import Feature
1. Navigate to **Admin → Attendance**
2. Select the target semester
3. Click **"Import Deli Scanner Data"** button

### Step 2: Upload File
1. Click the upload area or drag-and-drop your file
2. Supported formats: CSV, TXT, XLSX, XLS
3. File size limit: 10MB

### Step 3: Review Results
The system will display:
- **Imported Count**: New attendance records created
- **Updated Count**: Existing records that were updated
- **Skipped Count**: Invalid records that couldn't be processed
- **Error Details**: Specific errors encountered

## Common Issues & Solutions

### ❌ "User not found" Errors
- **Cause**: UserID in file doesn't match any student number or user ID
- **Solution**: 
  - Verify student numbers in your system match the export file
  - For 10-digit student numbers, ensure last 8 digits match Deli scanner IDs
  - Check if Deli scanner IDs need leading zeros added
  - Example: If student number is `2023123456`, Deli scanner should show `23123456`

### ❌ "Invalid date format" Errors
- **Cause**: Date format not recognized
- **Solution**: Use supported formats: YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY

### ❌ "Date outside semester range" Warnings
- **Cause**: Attendance date falls outside the 15-week semester period
- **Solution**: Check semester start dates and verify export date range

### ❌ "Required columns not found" Error
- **Cause**: File doesn't contain UserID and Date columns
- **Solution**: Ensure your export includes the required column headers

## Semester Configuration

### Current Semester Dates
```php
'2025-2026 1st semester' => '2025-08-15'  // August 15, 2025
'2025-2026 2nd semester' => '2026-01-15'  // January 15, 2026
'2026-2027 1st semester' => '2026-08-15'  // August 15, 2026
'2026-2027 2nd semester' => '2027-01-15'  // January 15, 2027
```

*Note: These dates can be adjusted in the AttendanceController if needed.*

## Best Practices

### 1. File Preparation
- Export data from Deli scanner covering the entire semester period
- Include all attendance records (even duplicates will be handled)
- Use clear, consistent date formats

### 2. Import Process
- Import data at the end of each week for incremental updates
- Or import the complete semester data at once
- Always review import results for any errors

### 3. Data Verification
- Check attendance percentages after import
- Verify weekly attendance patterns make sense
- Use the manual edit feature to correct any issues

## Technical Details

### Database Impact
- Creates/updates records in semester-specific tables
- Automatically calculates `weeks_present` and `attendance_30` scores
- Maintains data integrity with transaction rollback on errors

### Performance
- Processes files up to 10MB
- Handles thousands of attendance records efficiently
- Progress tracking for large files

### Security
- File type validation prevents malicious uploads
- User authentication required for import access
- All import activities are logged for audit trail

## Example Workflow

1. **Weekly Export**: Export attendance data from Deli scanner each week
2. **File Upload**: Upload the weekly export through the web interface
3. **Review Results**: Check import summary for any issues
4. **Manual Corrections**: Use edit mode to fix any incorrect entries
5. **Grade Calculation**: Attendance scores automatically feed into final grades

## Support

For technical issues or questions about the import process:
- Check the error messages in import results
- Verify file format matches requirements
- Contact system administrator for semester date adjustments
- Review system logs for detailed error information