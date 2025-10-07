<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Attendance;
use App\Models\SecondSemesterAttendance;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AttendanceController extends Controller
{
    /**
     * Get cadets with their attendance data for the admin attendance page
     */
    public function getCadets(Request $request)
    {
        try {
            $semester = $request->get('semester', '2025-2026 1st semester');
            
            // Get all cadets (non-admin users) ordered alphabetically by last name, then first name
            $cadets = User::where('role', '!=', 'admin')
                ->where('status', 'approved')
                ->orderBy('last_name')
                ->orderBy('first_name')
                ->get(['id', 'first_name', 'last_name', 'student_number', 'course', 'year', 'section', 'platoon', 'company', 'battalion']);
            
            $attendanceData = [];
            
            foreach ($cadets as $cadet) {
                // Determine which model to use based on semester
                if (strpos($semester, '1st semester') !== false) {
                    $attendance = Attendance::where('user_id', $cadet->id)
                        ->where('semester', $semester)
                        ->first();
                        
                    if (!$attendance) {
                        // Create new attendance record with 15 weeks
                        $attendanceData = [
                            'user_id' => $cadet->id,
                            'semester' => $semester,
                            'weeks_present' => 0,
                            'attendance_30' => 0,
                            'attendance_date' => now()->toDateString(),
                        ];
                        
                        // Initialize all weekly columns to false
                        for ($i = 1; $i <= 15; $i++) {
                            $attendanceData["week_{$i}"] = false;
                        }
                        
                        $attendance = Attendance::create($attendanceData);
                    }
                } else {
                    $attendance = SecondSemesterAttendance::where('user_id', $cadet->id)
                        ->where('semester', $semester)
                        ->first();
                        
                    if (!$attendance) {
                        // Create new attendance record with 15 weeks
                        $attendanceData = [
                            'user_id' => $cadet->id,
                            'semester' => $semester,
                            'weeks_present' => 0,
                            'attendance_30' => 0,
                            'attendance_date' => now()->toDateString(),
                        ];
                        
                        // Initialize all weekly columns to false
                        for ($i = 1; $i <= 15; $i++) {
                            $attendanceData["week_{$i}"] = false;
                        }
                        
                        $attendance = SecondSemesterAttendance::create($attendanceData);
                    }
                }
                
                // Get weekly attendance data from the database
                $weeklyAttendance = [];
                for ($week = 1; $week <= 15; $week++) {
                    $weeklyAttendance[$week] = (bool) $attendance->{"week_{$week}"};
                }
                
                $attendanceData[] = [
                    'user_id' => $cadet->id,
                    'first_name' => $cadet->first_name,
                    'last_name' => $cadet->last_name,
                    'student_number' => $cadet->student_number,
                    'course' => $cadet->course,
                    'year' => $cadet->year,
                    'section' => $cadet->section,
                    'platoon' => $cadet->platoon,
                    'company' => $cadet->company,
                    'battalion' => $cadet->battalion,
                    'weeks_present' => $attendance->weeks_present ?? 0,
                    'attendance_30' => $attendance->attendance_30 ?? 0,
                    'weekly_attendance' => $weeklyAttendance,
                ];
            }
            
            return response()->json([
                'success' => true,
                'data' => $attendanceData,
                'semester' => $semester,
                'max_weeks' => 15
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error fetching cadets attendance: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch cadets data'
            ], 500);
        }
    }
    
    /**
     * Update attendance for a specific cadet and week
     */
    public function updateAttendance(Request $request)
    {
        try {
            $request->validate([
                'user_id' => 'required|integer',
                'week_number' => 'required|integer|min:1|max:15',
                'is_present' => 'required|boolean',
                'semester' => 'required|string',
            ]);
            
            $userId = $request->user_id;
            $weekNumber = $request->week_number;
            $isPresent = $request->is_present;
            $semester = $request->semester;
            
            // Determine which model to use based on semester
            if (strpos($semester, '1st semester') !== false) {
                $attendance = Attendance::where('user_id', $userId)
                    ->where('semester', $semester)
                    ->first();
                    
                if (!$attendance) {
                    $attendanceData = [
                        'user_id' => $userId,
                        'semester' => $semester,
                        'weeks_present' => 0,
                        'attendance_30' => 0,
                        'attendance_date' => now()->toDateString(),
                    ];
                    
                    // Initialize all weekly columns to false
                    for ($i = 1; $i <= 15; $i++) {
                        $attendanceData["week_{$i}"] = false;
                    }
                    
                    $attendance = Attendance::create($attendanceData);
                }
            } else {
                $attendance = SecondSemesterAttendance::where('user_id', $userId)
                    ->where('semester', $semester)
                    ->first();
                    
                if (!$attendance) {
                    $attendanceData = [
                        'user_id' => $userId,
                        'semester' => $semester,
                        'weeks_present' => 0,
                        'attendance_30' => 0,
                        'attendance_date' => now()->toDateString(),
                    ];
                    
                    // Initialize all weekly columns to false
                    for ($i = 1; $i <= 15; $i++) {
                        $attendanceData["week_{$i}"] = false;
                    }
                    
                    $attendance = SecondSemesterAttendance::create($attendanceData);
                }
            }
            
            // Update the specific week
            $attendance->{"week_{$weekNumber}"} = $isPresent;
            
            // Recalculate total weeks present and attendance percentage
            $attendance->updateAttendancePercentage();
            
            return response()->json([
                'success' => true,
                'message' => 'Attendance updated successfully',
                'data' => [
                    'weeks_present' => $attendance->weeks_present,
                    'attendance_30' => $attendance->attendance_30,
                    'percentage' => round(($attendance->weeks_present / 15) * 100, 2)
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error updating attendance: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update attendance'
            ], 500);
        }
    }
    
    /**
     * Bulk update attendance for multiple cadets
     */
    public function bulkUpdateAttendance(Request $request)
    {
        try {
            $request->validate([
                'updates' => 'required|array',
                'updates.*.user_id' => 'required|integer',
                'updates.*.weekly_attendance' => 'required|array',
                'semester' => 'required|string',
            ]);
            
            $updates = $request->updates;
            $semester = $request->semester;
            
            DB::beginTransaction();
            
            foreach ($updates as $update) {
                $userId = $update['user_id'];
                $weeklyAttendance = $update['weekly_attendance'];
                
                // Determine which model to use based on semester
                if (strpos($semester, '1st semester') !== false) {
                    $attendance = Attendance::where('user_id', $userId)
                        ->where('semester', $semester)
                        ->first();
                        
                    if (!$attendance) {
                        $attendanceData = [
                            'user_id' => $userId,
                            'semester' => $semester,
                            'weeks_present' => 0,
                            'attendance_30' => 0,
                            'attendance_date' => now()->toDateString(),
                        ];
                        
                        // Initialize all weekly columns to false
                        for ($i = 1; $i <= 15; $i++) {
                            $attendanceData["week_{$i}"] = false;
                        }
                        
                        $attendance = Attendance::create($attendanceData);
                    }
                } else {
                    $attendance = SecondSemesterAttendance::where('user_id', $userId)
                        ->where('semester', $semester)
                        ->first();
                        
                    if (!$attendance) {
                        $attendanceData = [
                            'user_id' => $userId,
                            'semester' => $semester,
                            'weeks_present' => 0,
                            'attendance_30' => 0,
                            'attendance_date' => now()->toDateString(),
                        ];
                        
                        // Initialize all weekly columns to false
                        for ($i = 1; $i <= 15; $i++) {
                            $attendanceData["week_{$i}"] = false;
                        }
                        
                        $attendance = SecondSemesterAttendance::create($attendanceData);
                    }
                }
                
                // Update weekly attendance
                for ($week = 1; $week <= 15; $week++) {
                    $attendance->{"week_{$week}"} = isset($weeklyAttendance[$week]) ? (bool) $weeklyAttendance[$week] : false;
                }
                
                // Recalculate totals
                $attendance->updateAttendancePercentage();
            }
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Bulk attendance update completed successfully'
            ]);
            
        } catch (\Exception $e) {
            DB::rollback();
            Log::error('Error bulk updating attendance: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to bulk update attendance'
            ], 500);
        }
    }

    /**
     * Get attendance data for API endpoint used by frontend
     */
    public function index(Request $request)
    {
        return $this->getCadets($request);
    }

    /**
     * Import attendance data from Deli fingerprint scanner export file
     */
    public function importAttendanceData(Request $request)
    {
        try {
            // Validate the uploaded file
            $request->validate([
                'file' => 'required|file|mimes:csv,txt,xlsx,xls|max:10240', // 10MB max
                'semester' => 'required|string'
            ]);

            $file = $request->file('file');
            $semester = $request->semester;
            $fileName = $file->getClientOriginalName();
            $fileExtension = strtolower($file->getClientOriginalExtension());

            Log::info("Starting attendance import", [
                'file_name' => $fileName,
                'file_size' => $file->getSize(),
                'file_extension' => $fileExtension,
                'semester' => $semester
            ]);

            // Process the file based on its type
            $attendanceRecords = [];
            
            if ($fileExtension === 'csv' || $fileExtension === 'txt') {
                $attendanceRecords = $this->processCsvFile($file, $semester);
            } elseif (in_array($fileExtension, ['xlsx', 'xls'])) {
                try {
                    $attendanceRecords = $this->processExcelFile($file, $semester);
                } catch (\Exception $e) {
                    Log::warning("Excel processing failed, falling back to manual conversion message", [
                        'error' => $e->getMessage(),
                        'file' => $fileName
                    ]);
                    
                    return response()->json([
                        'success' => false,
                        'message' => 'Excel file processing failed. Please convert your Excel file to CSV format: Open Excel → Save As → CSV (Comma delimited), then try uploading the CSV file.',
                        'error_details' => 'Excel processing requires additional PHP extensions that are not available.'
                    ], 422);
                }
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Unsupported file format. Please use CSV, TXT, XLSX, or XLS files.'
                ], 422);
            }

            if (empty($attendanceRecords)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No valid attendance records found in the file. Please check that your file contains UserID, Date, and Time columns with valid data.'
                ], 422);
            }

            // Process and save attendance records
            $result = $this->saveImportedAttendance($attendanceRecords, $semester);

            return response()->json([
                'success' => true,
                'message' => 'Attendance data imported successfully',
                'imported_count' => $result['imported_count'],
                'updated_count' => $result['updated_count'],
                'skipped_count' => $result['skipped_count'],
                'errors' => $result['errors'],
                'affected_users' => $result['affected_users'],
                'affected_weeks' => $result['affected_weeks'],
                'semester' => $semester
            ]);

        } catch (\Exception $e) {
            Log::error('Error importing attendance data: ' . $e->getMessage(), [
                'file' => $request->hasFile('file') ? $request->file('file')->getClientOriginalName() : 'no file',
                'semester' => $request->semester ?? 'no semester',
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to import attendance data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Process CSV/TXT file from Deli fingerprint scanner
     */
    private function processCsvFile($file, $semester)
    {
        $attendanceRecords = [];
        $filePath = $file->getRealPath();
        
        // Try to detect delimiter
        $sampleContent = file_get_contents($filePath, false, null, 0, 1024);
        $delimiter = ',';
        if (substr_count($sampleContent, '\t') > substr_count($sampleContent, ',')) {
            $delimiter = '\t';
        }

        if (($handle = fopen($filePath, 'r')) !== false) {
            $header = fgetcsv($handle, 1000, $delimiter);
            
            // Map common Deli scanner column headers
            $columnMap = $this->mapCsvColumns($header);
            
            if (!$columnMap) {
                fclose($handle);
                throw new \Exception('Unable to identify required columns (UserID, Date, Time) in the file header.');
            }

            while (($data = fgetcsv($handle, 1000, $delimiter)) !== false) {
                if (count($data) < 3) continue; // Skip invalid rows
                
                $userIdIndex = $columnMap['user_id'];
                $dateIndex = $columnMap['date'];
                $timeIndex = $columnMap['time'];
                
                if (!isset($data[$userIdIndex]) || !isset($data[$dateIndex])) {
                    continue; // Skip rows with missing required data
                }

                $userId = trim($data[$userIdIndex]);
                $dateStr = trim($data[$dateIndex]);
                $timeStr = isset($data[$timeIndex]) ? trim($data[$timeIndex]) : '';

                // Parse and validate the data
                $parsedRecord = $this->parseAttendanceRecord($userId, $dateStr, $timeStr, $semester);
                if ($parsedRecord) {
                    $attendanceRecords[] = $parsedRecord;
                }
            }
            fclose($handle);
        }

        return $attendanceRecords;
    }

    /**
     * Process Excel file from Deli fingerprint scanner
     */
    private function processExcelFile($file, $semester)
    {
        $attendanceRecords = [];
        
        try {
            // Try different approaches for Excel processing
            
            // Method 1: Try using PHPSpreadsheet if available
            if (class_exists('\PhpOffice\PhpSpreadsheet\IOFactory')) {
                return $this->processExcelWithPhpSpreadsheet($file, $semester);
            }
            
            // Method 2: Try using COM objects (Windows only)
            if (class_exists('COM') && strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
                return $this->processExcelWithCOM($file, $semester);
            }
            
            // Method 3: Try reading Excel as XML (for newer Excel files)
            if (in_array(strtolower($file->getClientOriginalExtension()), ['xlsx'])) {
                return $this->processExcelAsXML($file, $semester);
            }
            
            // Method 4: Fallback - provide clear conversion instructions
            throw new \Exception('Excel processing requires additional setup. Please convert your Excel file to CSV format and try again.');
            
        } catch (\Exception $e) {
            Log::error('Error processing Excel file: ' . $e->getMessage());
            throw new \Exception('Failed to process Excel file. Please save your Excel file as CSV format: Open Excel → Save As → CSV (Comma delimited), then try uploading the CSV file.');
        }
    }

    /**
     * Process Excel using PHPSpreadsheet (if available)
     */
    private function processExcelWithPhpSpreadsheet($file, $semester)
    {
        try {
            $reader = \PhpOffice\PhpSpreadsheet\IOFactory::createReaderForFile($file->getRealPath());
            $reader->setReadDataOnly(true);
            $spreadsheet = $reader->load($file->getRealPath());
            $worksheet = $spreadsheet->getActiveSheet();
            
            $attendanceRecords = [];
            $headerRow = null;
            $columnMap = null;
            
            foreach ($worksheet->getRowIterator() as $rowIndex => $row) {
                $cellIterator = $row->getCellIterator();
                $cellIterator->setIterateOnlyExistingCells(false);
                
                $rowData = [];
                foreach ($cellIterator as $cell) {
                    $rowData[] = $cell->getFormattedValue();
                }
                
                // First row is typically the header
                if ($rowIndex === 1) {
                    $headerRow = array_map('trim', $rowData);
                    $columnMap = $this->mapCsvColumns($headerRow);
                    
                    if (!$columnMap) {
                        throw new \Exception('Unable to identify required columns (UserID, Date, Time) in the Excel file header.');
                    }
                    continue;
                }
                
                // Skip empty rows
                if (empty(array_filter($rowData))) {
                    continue;
                }
                
                // Process data row
                if ($columnMap && count($rowData) >= max($columnMap)) {
                    $userId = trim($rowData[$columnMap['user_id']] ?? '');
                    $dateStr = trim($rowData[$columnMap['date']] ?? '');
                    $timeStr = trim($rowData[$columnMap['time']] ?? '');
                    
                    if (!empty($userId) && !empty($dateStr)) {
                        $parsedRecord = $this->parseAttendanceRecord($userId, $dateStr, $timeStr, $semester);
                        if ($parsedRecord) {
                            $attendanceRecords[] = $parsedRecord;
                        }
                    }
                }
            }
            
            Log::info("PHPSpreadsheet processing completed", [
                'records_found' => count($attendanceRecords),
                'file' => $file->getClientOriginalName()
            ]);
            
            return $attendanceRecords;
            
        } catch (\Exception $e) {
            Log::error('PHPSpreadsheet processing failed: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Process Excel using COM objects (Windows only)
     */
    private function processExcelWithCOM($file, $semester)
    {
        try {
            $excel = new \COM("Excel.Application");
            $excel->Visible = false;
            $excel->DisplayAlerts = false;
            
            $workbook = $excel->Workbooks->Open($file->getRealPath());
            $worksheet = $workbook->Worksheets(1);
            
            $attendanceRecords = [];
            $headerRow = null;
            $columnMap = null;
            $row = 1;
            
            // Get the header row
            $headerData = [];
            $col = 1;
            while (true) {
                $cellValue = $worksheet->Cells($row, $col)->Value;
                if (empty($cellValue)) {
                    break;
                }
                $headerData[] = trim($cellValue);
                $col++;
            }
            
            $columnMap = $this->mapCsvColumns($headerData);
            if (!$columnMap) {
                throw new \Exception('Unable to identify required columns (UserID, Date, Time) in the Excel file header.');
            }
            
            // Process data rows
            $row = 2;
            while (true) {
                $userId = trim($worksheet->Cells($row, $columnMap['user_id'] + 1)->Value ?? '');
                $dateStr = trim($worksheet->Cells($row, $columnMap['date'] + 1)->Value ?? '');
                $timeStr = trim($worksheet->Cells($row, $columnMap['time'] + 1)->Value ?? '');
                
                // Break if we encounter an empty row
                if (empty($userId) && empty($dateStr)) {
                    break;
                }
                
                if (!empty($userId) && !empty($dateStr)) {
                    $parsedRecord = $this->parseAttendanceRecord($userId, $dateStr, $timeStr, $semester);
                    if ($parsedRecord) {
                        $attendanceRecords[] = $parsedRecord;
                    }
                }
                
                $row++;
            }
            
            $workbook->Close(false);
            $excel->Quit();
            
            Log::info("COM Excel processing completed", [
                'records_found' => count($attendanceRecords),
                'file' => $file->getClientOriginalName()
            ]);
            
            return $attendanceRecords;
            
        } catch (\Exception $e) {
            Log::error('COM Excel processing failed: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Process Excel as XML (for .xlsx files)
     */
    private function processExcelAsXML($file, $semester)
    {
        try {
            // This is a simplified approach for .xlsx files which are actually ZIP archives
            $zip = new \ZipArchive();
            if ($zip->open($file->getRealPath()) === TRUE) {
                
                // Try to read the shared strings (for text values)
                $sharedStrings = [];
                if ($zip->locateName('xl/sharedStrings.xml') !== false) {
                    $sharedStringsXml = $zip->getFromName('xl/sharedStrings.xml');
                    if ($sharedStringsXml) {
                        $xml = simplexml_load_string($sharedStringsXml);
                        foreach ($xml->si as $si) {
                            $sharedStrings[] = (string)$si->t;
                        }
                    }
                }
                
                // Read the worksheet data
                $worksheetXml = $zip->getFromName('xl/worksheets/sheet1.xml');
                if (!$worksheetXml) {
                    throw new \Exception('Unable to read worksheet data from Excel file');
                }
                
                $xml = simplexml_load_string($worksheetXml);
                $attendanceRecords = [];
                $headerRow = null;
                $columnMap = null;
                $rowIndex = 0;
                
                foreach ($xml->sheetData->row as $row) {
                    $rowIndex++;
                    $rowData = [];
                    
                    foreach ($row->c as $cell) {
                        $cellValue = '';
                        
                        if (isset($cell->v)) {
                            $value = (string)$cell->v;
                            
                            // Check if this is a shared string
                            if (isset($cell['t']) && (string)$cell['t'] === 's') {
                                $cellValue = isset($sharedStrings[intval($value)]) ? $sharedStrings[intval($value)] : $value;
                            } else {
                                $cellValue = $value;
                            }
                        }
                        
                        $rowData[] = trim($cellValue);
                    }
                    
                    // First row is header
                    if ($rowIndex === 1) {
                        $headerRow = $rowData;
                        $columnMap = $this->mapCsvColumns($headerRow);
                        
                        if (!$columnMap) {
                            throw new \Exception('Unable to identify required columns (UserID, Date, Time) in the Excel file header.');
                        }
                        continue;
                    }
                    
                    // Process data rows
                    if ($columnMap && count($rowData) >= max($columnMap)) {
                        $userId = trim($rowData[$columnMap['user_id']] ?? '');
                        $dateStr = trim($rowData[$columnMap['date']] ?? '');
                        $timeStr = trim($rowData[$columnMap['time']] ?? '');
                        
                        if (!empty($userId) && !empty($dateStr)) {
                            $parsedRecord = $this->parseAttendanceRecord($userId, $dateStr, $timeStr, $semester);
                            if ($parsedRecord) {
                                $attendanceRecords[] = $parsedRecord;
                            }
                        }
                    }
                }
                
                $zip->close();
                
                Log::info("XML Excel processing completed", [
                    'records_found' => count($attendanceRecords),
                    'file' => $file->getClientOriginalName()
                ]);
                
                return $attendanceRecords;
                
            } else {
                throw new \Exception('Unable to open Excel file as ZIP archive');
            }
            
        } catch (\Exception $e) {
            Log::error('XML Excel processing failed: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Map CSV column headers to required fields
     */
    private function mapCsvColumns($header)
    {
        $columnMap = [];
        $header = array_map('strtolower', array_map('trim', $header));
        
        // Look for UserID column
        $userIdPatterns = ['userid', 'user_id', 'user id', 'id', 'employee_id', 'emp_id'];
        foreach ($userIdPatterns as $pattern) {
            $index = array_search($pattern, $header);
            if ($index !== false) {
                $columnMap['user_id'] = $index;
                break;
            }
        }
        
        // Look for Date column
        $datePatterns = ['date', 'attendance_date', 'check_date', 'scan_date', 'timestamp'];
        foreach ($datePatterns as $pattern) {
            $index = array_search($pattern, $header);
            if ($index !== false) {
                $columnMap['date'] = $index;
                break;
            }
        }
        
        // Look for Time column
        $timePatterns = ['time', 'check_time', 'scan_time', 'clock_time'];
        foreach ($timePatterns as $pattern) {
            $index = array_search($pattern, $header);
            if ($index !== false) {
                $columnMap['time'] = $index;
                break;
            }
        }
        
        // Return null if required columns are not found
        if (!isset($columnMap['user_id']) || !isset($columnMap['date'])) {
            return null;
        }
        
        return $columnMap;
    }

    /**
     * Parse individual attendance record
     */
    private function parseAttendanceRecord($userId, $dateStr, $timeStr, $semester)
    {
        try {
            // Clean the user ID from Deli scanner
            $deliUserId = trim($userId);
            
            // Find user by student number with truncation logic
            $user = null;
            
            // First try exact match with student number or ID
            $user = User::where('student_number', $deliUserId)
                     ->orWhere('id', $deliUserId)
                     ->where('role', '!=', 'admin')
                     ->first();
            
            // If no exact match found, try matching with truncated student numbers
            if (!$user) {
                // Get all users and check if their student number matches when first 2 digits are removed
                $allUsers = User::where('role', '!=', 'admin')
                    ->whereNotNull('student_number')
                    ->get();
                
                foreach ($allUsers as $potentialUser) {
                    $studentNumber = $potentialUser->student_number;
                    
                    // If student number has 10 digits, remove first 2 and compare with Deli ID (8 digits)
                    if (strlen($studentNumber) == 10) {
                        $truncatedNumber = substr($studentNumber, 2);
                        
                        // Compare truncated number with Deli scanner ID
                        if ($truncatedNumber === $deliUserId) {
                            $user = $potentialUser;
                            Log::info("Found user match using truncated student number", [
                                'deli_id' => $deliUserId,
                                'full_student_number' => $studentNumber,
                                'truncated_number' => $truncatedNumber,
                                'user_id' => $user->id
                            ]);
                            break;
                        }
                    }
                    
                    // Also try if the Deli ID needs padding (in case it's stored with leading zeros removed)
                    if (strlen($deliUserId) < 8) {
                        $paddedDeliId = str_pad($deliUserId, 8, '0', STR_PAD_LEFT);
                        if (strlen($studentNumber) == 10) {
                            $truncatedNumber = substr($studentNumber, 2);
                            if ($truncatedNumber === $paddedDeliId) {
                                $user = $potentialUser;
                                Log::info("Found user match using padded Deli ID", [
                                    'original_deli_id' => $deliUserId,
                                    'padded_deli_id' => $paddedDeliId,
                                    'full_student_number' => $studentNumber,
                                    'truncated_number' => $truncatedNumber,
                                    'user_id' => $user->id
                                ]);
                                break;
                            }
                        }
                    }
                }
            }
            
            if (!$user) {
                Log::warning("User not found for Deli ID: {$deliUserId}. Tried exact match and truncated student number matching.");
                return null;
            }

            // Parse date
            $date = $this->parseDate($dateStr);
            if (!$date) {
                Log::warning("Invalid date format: {$dateStr}");
                return null;
            }

            // Determine which week this date falls into
            $weekNumber = $this->getWeekNumber($date, $semester);
            if (!$weekNumber) {
                Log::warning("Date {$date} does not fall within semester {$semester}");
                return null;
            }

            return [
                'user_id' => $user->id,
                'date' => $date,
                'time' => $timeStr,
                'week_number' => $weekNumber,
                'semester' => $semester
            ];

        } catch (\Exception $e) {
            Log::error("Error parsing attendance record: " . $e->getMessage(), [
                'user_id' => $userId,
                'date' => $dateStr,
                'time' => $timeStr
            ]);
            return null;
        }
    }

    /**
     * Parse date from various formats
     */
    private function parseDate($dateStr)
    {
        $dateStr = trim($dateStr);
        
        // If empty, return null
        if (empty($dateStr)) {
            return null;
        }
        
        $formats = [
            'Y-m-d',
            'm/d/Y',
            'd/m/Y',
            'Y/m/d',
            'm-d-Y',
            'd-m-Y',
            'Y.m.d',
            'm.d.Y',
            'd.m.Y'
        ];

        // First try exact format matching
        foreach ($formats as $format) {
            $date = \DateTime::createFromFormat($format, $dateStr);
            if ($date && $date->format($format) === $dateStr) {
                return $date->format('Y-m-d');
            }
        }

        // If exact matching fails, try with flexible parsing for common formats
        // Handle formats like "10/5/2025" (single digit day/month)
        if (preg_match('/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/', $dateStr, $matches)) {
            $month = str_pad($matches[1], 2, '0', STR_PAD_LEFT);
            $day = str_pad($matches[2], 2, '0', STR_PAD_LEFT);
            $year = $matches[3];
            
            // Try both MM/DD/YYYY and DD/MM/YYYY interpretations
            $formatters = [
                "{$month}/{$day}/{$year}" => 'm/d/Y',  // US format
                "{$day}/{$month}/{$year}" => 'd/m/Y'   // International format
            ];
            
            foreach ($formatters as $paddedDate => $format) {
                $date = \DateTime::createFromFormat($format, $paddedDate);
                if ($date) {
                    Log::info("Successfully parsed date using flexible parsing", [
                        'original' => $dateStr,
                        'padded' => $paddedDate,
                        'format' => $format,
                        'result' => $date->format('Y-m-d')
                    ]);
                    return $date->format('Y-m-d');
                }
            }
        }

        // Handle formats like "10-5-2025" or "10.5.2025"
        if (preg_match('/^(\d{1,2})[-\.](\d{1,2})[-\.](\d{4})$/', $dateStr, $matches)) {
            $part1 = str_pad($matches[1], 2, '0', STR_PAD_LEFT);
            $part2 = str_pad($matches[2], 2, '0', STR_PAD_LEFT);
            $year = $matches[3];
            
            $delimiter = (strpos($dateStr, '-') !== false) ? '-' : '.';
            
            // Try both interpretations
            $formatters = [
                "{$part1}{$delimiter}{$part2}{$delimiter}{$year}" => "m{$delimiter}d{$delimiter}Y",
                "{$part2}{$delimiter}{$part1}{$delimiter}{$year}" => "d{$delimiter}m{$delimiter}Y"
            ];
            
            foreach ($formatters as $paddedDate => $format) {
                $date = \DateTime::createFromFormat($format, $paddedDate);
                if ($date) {
                    Log::info("Successfully parsed date using delimiter flexible parsing", [
                        'original' => $dateStr,
                        'padded' => $paddedDate,
                        'format' => $format,
                        'result' => $date->format('Y-m-d')
                    ]);
                    return $date->format('Y-m-d');
                }
            }
        }

        Log::warning("Could not parse date format", ['date_string' => $dateStr]);
        return null;
    }

    /**
     * Determine week number based on date and semester
     */
    private function getWeekNumber($date, $semester)
    {
        // Define semester start dates (you may need to adjust these)
        $semesterStarts = [
            '2025-2026 1st semester' => '2025-08-15',
            '2025-2026 2nd semester' => '2026-01-15',
            '2026-2027 1st semester' => '2026-08-15',
            '2026-2027 2nd semester' => '2027-01-15',
        ];

        if (!isset($semesterStarts[$semester])) {
            Log::warning("Unknown semester for week calculation", ['semester' => $semester]);
            return null;
        }

        $startDate = new \DateTime($semesterStarts[$semester]);
        $checkDate = new \DateTime($date);
        
        Log::info("Week calculation debug", [
            'semester' => $semester,
            'start_date' => $startDate->format('Y-m-d'),
            'check_date' => $checkDate->format('Y-m-d'),
            'semester_start' => $semesterStarts[$semester]
        ]);
        
        if ($checkDate < $startDate) {
            Log::warning("Date is before semester start", [
                'check_date' => $date,
                'semester_start' => $semesterStarts[$semester]
            ]);
            return null;
        }

        $daysDiff = $checkDate->diff($startDate)->days;
        $weekNumber = floor($daysDiff / 7) + 1;

        Log::info("Week calculation result", [
            'days_diff' => $daysDiff,
            'calculated_week' => $weekNumber,
            'valid_range' => ($weekNumber >= 1 && $weekNumber <= 15)
        ]);

        // Ensure week number is within valid range (1-15)
        return ($weekNumber >= 1 && $weekNumber <= 15) ? $weekNumber : null;
    }

    /**
     * Save imported attendance records to database
     */
    private function saveImportedAttendance($attendanceRecords, $semester)
    {
        $importedCount = 0;
        $updatedCount = 0;
        $skippedCount = 0;
        $errors = [];
        $affectedUsers = [];
        $affectedWeeks = [];

        DB::beginTransaction();

        try {
            // Group records by user
            $userAttendance = [];
            foreach ($attendanceRecords as $record) {
                $userId = $record['user_id'];
                $weekNumber = $record['week_number'];
                
                if (!isset($userAttendance[$userId])) {
                    $userAttendance[$userId] = [];
                }
                $userAttendance[$userId][$weekNumber] = true;
                
                // Track affected users and weeks
                if (!in_array($userId, $affectedUsers)) {
                    $affectedUsers[] = $userId;
                }
                if (!in_array($weekNumber, $affectedWeeks)) {
                    $affectedWeeks[] = $weekNumber;
                }
            }

            foreach ($userAttendance as $userId => $weeks) {
                try {
                    $recordExists = false;
                    
                    // Determine which model to use
                    if (strpos($semester, '1st semester') !== false) {
                        $attendance = Attendance::where('user_id', $userId)
                            ->where('semester', $semester)
                            ->first();
                            
                        if (!$attendance) {
                            $attendanceData = [
                                'user_id' => $userId,
                                'semester' => $semester,
                                'weeks_present' => 0,
                                'attendance_30' => 0,
                                'attendance_date' => now()->toDateString(),
                            ];
                            
                            // Initialize all weekly columns
                            for ($i = 1; $i <= 15; $i++) {
                                $attendanceData["week_{$i}"] = false;
                            }
                            
                            $attendance = Attendance::create($attendanceData);
                            $importedCount++;
                        } else {
                            $recordExists = true;
                            $updatedCount++;
                        }
                    } else {
                        $attendance = SecondSemesterAttendance::where('user_id', $userId)
                            ->where('semester', $semester)
                            ->first();
                            
                        if (!$attendance) {
                            $attendanceData = [
                                'user_id' => $userId,
                                'semester' => $semester,
                                'weeks_present' => 0,
                                'attendance_30' => 0,
                                'attendance_date' => now()->toDateString(),
                            ];
                            
                            // Initialize all weekly columns
                            for ($i = 1; $i <= 15; $i++) {
                                $attendanceData["week_{$i}"] = false;
                            }
                            
                            $attendance = SecondSemesterAttendance::create($attendanceData);
                            $importedCount++;
                        } else {
                            $recordExists = true;
                            $updatedCount++;
                        }
                    }

                    // Update weekly attendance
                    $updatedWeeks = [];
                    foreach ($weeks as $weekNumber => $isPresent) {
                        $previousValue = $attendance->{"week_{$weekNumber}"};
                        $attendance->{"week_{$weekNumber}"} = $isPresent;
                        
                        if ($previousValue !== $isPresent) {
                            $updatedWeeks[] = $weekNumber;
                        }
                    }

                    // Recalculate totals
                    $attendance->updateAttendancePercentage();
                    
                    // Log the import action
                    Log::info("Attendance import processed for user", [
                        'user_id' => $userId,
                        'semester' => $semester,
                        'updated_weeks' => $updatedWeeks,
                        'record_existed' => $recordExists,
                        'final_weeks_present' => $attendance->weeks_present,
                        'final_attendance_score' => $attendance->attendance_30
                    ]);

                } catch (\Exception $e) {
                    $skippedCount++;
                    $errors[] = "Error processing user ID {$userId}: " . $e->getMessage();
                    Log::error("Error saving attendance for user {$userId}: " . $e->getMessage());
                }
            }

            DB::commit();
            
            // Sort affected weeks for better reporting
            sort($affectedWeeks);

            Log::info("Attendance import completed successfully", [
                'semester' => $semester,
                'imported_count' => $importedCount,
                'updated_count' => $updatedCount,
                'skipped_count' => $skippedCount,
                'affected_users' => count($affectedUsers),
                'affected_weeks' => $affectedWeeks
            ]);

            return [
                'imported_count' => $importedCount,
                'updated_count' => $updatedCount,
                'skipped_count' => $skippedCount,
                'errors' => $errors,
                'affected_users' => $affectedUsers,
                'affected_weeks' => $affectedWeeks
            ];

        } catch (\Exception $e) {
            DB::rollback();
            throw $e;
        }
    }

    /**
     * Fallback Excel conversion (for when other methods fail)
     */
    private function convertExcelToCsv($file)
    {
        throw new \Exception('Excel processing requires additional PHP extensions or components. Please save your Excel file as CSV format: Open Excel → Save As → CSV (Comma delimited), then try uploading the CSV file.');
    }

    /**
     * Get attendance data for a specific user
     */
    public function getUserAttendance(Request $request, $userId)
    {
        try {
            $semester = $request->get('semester', '2025-2026 1st semester');
            $currentUser = auth()->user();
            
            // Allow access if user is admin/faculty OR if they're requesting their own data
            if ($currentUser->role !== 'admin' && $currentUser->role !== 'faculty' && $currentUser->id != $userId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. You can only view your own attendance data.'
                ], 403);
            }
            
            // Get the user
            $user = User::where('id', $userId)
                ->where('status', 'approved')
                ->first(['id', 'first_name', 'last_name', 'student_number', 'course', 'year', 'section']);
                
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found or not approved'
                ], 404);
            }
            
            // Determine which model to use based on semester
            if (strpos($semester, '1st semester') !== false) {
                $attendance = Attendance::where('user_id', $userId)
                    ->where('semester', $semester)
                    ->first();
                    
                if (!$attendance) {
                    // Create new attendance record with 15 weeks (all absent)
                    $attendanceData = [
                        'user_id' => $userId,
                        'semester' => $semester,
                        'weeks_present' => 0,
                        'attendance_30' => 0,
                        'attendance_date' => now()->toDateString(),
                    ];
                    
                    // Initialize all weekly columns to false
                    for ($i = 1; $i <= 15; $i++) {
                        $attendanceData["week_{$i}"] = false;
                    }
                    
                    $attendance = Attendance::create($attendanceData);
                }
            } else {
                $attendance = SecondSemesterAttendance::where('user_id', $userId)
                    ->where('semester', $semester)
                    ->first();
                    
                if (!$attendance) {
                    // Create new attendance record with 15 weeks (all absent)
                    $attendanceData = [
                        'user_id' => $userId,
                        'semester' => $semester,
                        'weeks_present' => 0,
                        'attendance_30' => 0,
                        'attendance_date' => now()->toDateString(),
                    ];
                    
                    // Initialize all weekly columns to false
                    for ($i = 1; $i <= 15; $i++) {
                        $attendanceData["week_{$i}"] = false;
                    }
                    
                    $attendance = SecondSemesterAttendance::create($attendanceData);
                }
            }
            
            // Get weekly attendance data from the database
            $weeklyAttendance = [];
            for ($week = 1; $week <= 15; $week++) {
                $weeklyAttendance[$week] = (bool) $attendance->{"week_{$week}"};
            }
            
            $userAttendanceData = [
                'user_id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'student_number' => $user->student_number,
                'course' => $user->course,
                'year' => $user->year,
                'section' => $user->section,
                'weeks_present' => $attendance->weeks_present ?? 0,
                'attendance_30' => $attendance->attendance_30 ?? 0,
                'weekly_attendance' => $weeklyAttendance,
            ];
            
            return response()->json([
                'success' => true,
                'data' => $userAttendanceData,
                'semester' => $semester,
                'max_weeks' => 15
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error fetching user attendance: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch user attendance data'
            ], 500);
        }
    }
}