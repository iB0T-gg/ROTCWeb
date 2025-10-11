# Attendance Import Guide

This guide explains how to import attendance data from your Deli fingerprint scanner or other attendance systems into the ROTC Web Portal.

## Supported File Formats

The system supports the following file formats:
- **CSV** (Comma Separated Values) - Recommended
- **TXT** (Tab-delimited text files)
- **XLSX** (Excel files) - Coming soon
- **XLS** (Legacy Excel files) - Coming soon

## Required Data Format

Your import file must contain the following columns (case-insensitive):

### Required Columns:
1. **UserID** (or Student_ID, ID, Student_Number)
   - The student number or user ID that matches your system
   - Examples: "2021-123456", "123456", "STU001"

2. **Date** (or Attendance_Date, Scan_Date)
   - The date of attendance in any standard format
   - Examples: "2025-10-05", "10/05/2025", "Oct 5, 2025"

3. **Time** (or Attendance_Time, Scan_Time)
   - The time of attendance (optional but recommended)
   - Examples: "08:30:00", "8:30 AM", "08:30"

## Sample CSV Format

```csv
UserID,Date,Time
2021-123456,2025-10-05,08:30:00
2021-123457,2025-10-05,08:31:15
2021-123458,2025-10-05,08:32:30
```

## Alternative Column Names

The system automatically recognizes these alternative column names:

| Standard | Alternatives |
|----------|-------------|
| UserID | User_ID, ID, Student_ID, Student_Number |
| Date | Attendance_Date, Scan_Date |
| Time | Attendance_Time, Scan_Time |

## Deli Scanner Export Instructions

If you're using a Deli fingerprint scanner:

1. **Access the scanner's software interface**
2. **Navigate to the reports/export section**
3. **Select the date range** you want to export
4. **Choose CSV or TXT format** for export
5. **Ensure the export includes:** User ID, Date, and Time columns
6. **Save the file** to your computer
7. **Upload the file** using the Import USB Data button

## Import Process

1. Click the **"Import USB Data"** button on the Attendance page
2. Select your exported file (CSV, TXT, XLSX, or XLS)
3. Choose the correct semester
4. Click **"Import"** to process the data
5. Review the import results

## Import Results

After import, you'll see:
- **Imported Count**: New attendance records added
- **Updated Count**: Existing records that were updated
- **Skipped Count**: Records that couldn't be processed
- **Error Details**: Specific issues with any failed records

## Week Calculation

The system automatically calculates which week each attendance record belongs to based on:
- **Semester start dates**:
  - 2025-2026 1st semester: September 1, 2025
  - 2025-2026 2nd semester: February 1, 2026
- **Maximum weeks per semester**:
  - 1st semester: 10 weeks
  - 2nd semester: 15 weeks

## Data Validation

The import system validates:
- ✅ User exists in the system
- ✅ Date format is valid
- ✅ Date falls within semester bounds
- ✅ File format is supported
- ✅ Required columns are present

## Troubleshooting

### Common Issues:

1. **"User not found for ID: XXXXX"**
   - Ensure the UserID in your file matches the student numbers in the system
   - Check for extra spaces or formatting issues

2. **"Invalid date format"**
   - Use standard date formats (YYYY-MM-DD, MM/DD/YYYY, etc.)
   - Ensure dates are not text or contain invalid characters

3. **"Missing required column"**
   - Verify your file has UserID, Date, and Time columns
   - Check the column headers match the expected names

4. **"Date is before semester start"**
   - Check that your attendance dates fall within the selected semester period

### File Format Tips:

- **Save Excel files as CSV** before importing for best compatibility
- **Use UTF-8 encoding** to avoid character issues
- **Keep file size under 10MB**
- **Remove empty rows** at the end of your file

## Support

If you encounter issues with importing:
1. Check the error messages in the import results
2. Verify your file format matches the requirements
3. Contact IT support with the specific error details

## Example Files

### CSV Example:
```csv
UserID,Date,Time
2021-001,2025-10-01,08:00:00
2021-002,2025-10-01,08:01:30
2021-003,2025-10-01,08:02:15
```

### TXT Example (Tab-delimited):
```
UserID	Date	Time
2021-001	2025-10-01	08:00:00
2021-002	2025-10-01	08:01:30
2021-003	2025-10-01	08:02:15
```

This import system helps you efficiently transfer attendance data from your scanner to the web portal while maintaining data integrity and providing detailed feedback on the import process.