<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\SecondSemesterAttendance;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AttendanceController extends Controller
{
    /**
     * Get the appropriate attendance model based on semester.
     *
     * @param  string  $semester
     * @return string
     */
    private function getAttendanceModelForSemester($semester)
    {
        if (strpos($semester, '1st semester') !== false) {
            return Attendance::class;
        } elseif (strpos($semester, '2nd semester') !== false) {
            return SecondSemesterAttendance::class;
        }
        return Attendance::class; // Default to first semester
    }

    /**
     * Get the maximum number of weeks for a semester.
     *
     * @param  string  $semester
     * @return int
     */
    private function getMaxWeeksForSemester($semester)
    {
        if (strpos($semester, '2025-2026 1st semester') !== false) {
            return 10; // 2025-2026 1st semester: 10 weeks max
        } elseif (strpos($semester, '2026-2027 2nd semester') !== false) {
            return 15; // 2026-2027 2nd semester: 15 weeks max
        }
        return 15; // Default to 15 weeks
    }

    /**
     * Update attendance record for a user.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function updateAttendance(Request $request)
    {
        $semester = $request->input('semester', '2025-2026 1st semester');
        $maxWeeks = $this->getMaxWeeksForSemester($semester);
        
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'week_number' => "required|integer|min:1|max:{$maxWeeks}",
            'is_present' => 'required|boolean',
            'semester' => 'required|string',
        ]);

        $attendanceModel = $this->getAttendanceModelForSemester($semester);

        // For first semester, we work with aggregated data
        if (strpos($semester, '1st semester') !== false) {
            // Get or create aggregated record
            $attendance = $attendanceModel::where('user_id', $request->user_id)
                ->where('semester', $semester)
                ->first();

            if (!$attendance) {
                $attendance = $attendanceModel::create([
                    'user_id' => $request->user_id,
                    'semester' => $semester,
                    'weeks_present' => 0,
                    'attendance_30' => 0.00,
                    'attendance_date' => now()->toDateString(),
                ]);
            }

            // Update weeks_present based on the week being marked
            if ($request->is_present) {
                // If marking present for a week that hasn't been counted yet
                if ($request->week_number > $attendance->weeks_present) {
                    $attendance->weeks_present = $request->week_number;
                }
            } else {
                // If marking absent, reduce weeks_present if this was the latest week
                if ($request->week_number == $attendance->weeks_present) {
                    $attendance->weeks_present = max(0, $request->week_number - 1);
                }
            }

            // Calculate average: weeks_present / 10 (total weeks) * 100 for 1st semester
            $attendance->average = round(($attendance->weeks_present / 10) * 100, 2);
            
            // Calculate attendance_30 using average * 0.30
            $attendance->attendance_30 = round($attendance->average * 0.30);
            
            $attendance->attendance_date = now()->toDateString();
            $attendance->save();

        } else {
            // For second semester, use aggregated data (same as first semester)
            $attendance = $attendanceModel::where('user_id', $request->user_id)
                ->where('semester', $semester)
                ->first();

            if (!$attendance) {
                $attendance = $attendanceModel::create([
                    'user_id' => $request->user_id,
                    'semester' => $semester,
                    'weeks_present' => 0,
                    'attendance_30' => 0,
                    'average' => 0.00,
                    'attendance_date' => now()->toDateString(),
                ]);
            }

            // Update weeks_present based on the week being marked
            if ($request->is_present) {
                // If marking present for a week that hasn't been counted yet
                if ($request->week_number > $attendance->weeks_present) {
                    $attendance->weeks_present = $request->week_number;
                }
            } else {
                // If marking absent, reduce weeks_present if this was the latest week
                if ($request->week_number == $attendance->weeks_present) {
                    $attendance->weeks_present = max(0, $request->week_number - 1);
                }
            }

            // Calculate average: weeks_present / 15 (total weeks) * 100 for 2nd semester
            $attendance->average = round(($attendance->weeks_present / 15) * 100, 2);
            
            // Calculate attendance_30 using average * 0.30
            $attendance->attendance_30 = round($attendance->average * 0.30);
            
            $attendance->attendance_date = now()->toDateString();
            $attendance->save();
        }

        // Clear any relevant caches to ensure immediate data availability
        \Cache::forget("attendance_{$semester}");
        \Cache::forget("final_grades_{$semester}");

        return response()->json(['success' => true]);
    }

    /**
     * Handle fingerprint scan attendance.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function fingerprintScan(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'semester' => 'required|string',
        ]);

        $semester = $request->input('semester', '2025-2026 1st semester');
        $maxWeeks = $this->getMaxWeeksForSemester($semester);
        $attendanceModel = $this->getAttendanceModelForSemester($semester);

        // Get or create aggregated attendance record
        $attendance = $attendanceModel::where('user_id', $request->user_id)
            ->where('semester', $semester)
            ->first();

        if (!$attendance) {
            $attendance = $attendanceModel::create([
                'user_id' => $request->user_id,
                'semester' => $semester,
                'weeks_present' => 0,
                'attendance_30' => 0,
                'average' => 0.00,
                'attendance_date' => now()->toDateString(),
            ]);
        }

        // Check if all weeks are already present
        if ($attendance->weeks_present >= $maxWeeks) {
            return response()->json([
                'success' => false,
                'message' => 'All weeks have been marked as present for this semester.'
            ], 400);
        }

        // Increment weeks_present
        $nextWeek = $attendance->weeks_present + 1;
        $attendance->weeks_present = $nextWeek;

        // Calculate average based on semester
        if (strpos($semester, '1st semester') !== false) {
            $attendance->average = round(($attendance->weeks_present / 10) * 100, 2);
        } else {
            $attendance->average = round(($attendance->weeks_present / 15) * 100, 2);
        }
        
        // Calculate attendance_30 using average * 0.30
        $attendance->attendance_30 = round($attendance->average * 0.30);
        
        $attendance->attendance_date = now()->toDateString();
        $attendance->save();

        return response()->json([
            'success' => true,
            'message' => "Attendance marked for Week {$nextWeek}",
            'week_number' => $nextWeek
        ]);
    }

    /**
     * Get all attendance records for a specific user.
     *
     * @param  int  $userId
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function getUserAttendance($userId, Request $request)
    {
        $semester = $request->input('semester', '2025-2026 1st semester');
        $attendanceModel = $this->getAttendanceModelForSemester($semester);
        
        $attendances = $attendanceModel::where('user_id', $userId)
            ->where('semester', $semester)
            ->get();
        return response()->json($attendances);
    }

    /**
     * Get all attendance records.
     *
     * @return \Illuminate\Http\Response
     */
    public function getAllAttendance(Request $request)
    {
        $semester = $request->input('semester', '2025-2026 1st semester');
        $attendanceModel = $this->getAttendanceModelForSemester($semester);
        $maxWeeks = $this->getMaxWeeksForSemester($semester);
        
        // Get all users with role 'user' (cadets)
        $users = User::where('role', 'user')->get();
        \Log::info('Getting attendance for ' . $users->count() . ' cadets');
        $attendanceData = [];

        foreach ($users as $user) {
            if (strpos($semester, '1st semester') !== false) {
                // For first semester, get aggregated record
                $attendance = $attendanceModel::where('user_id', $user->id)
                    ->where('semester', $semester)
                    ->first();
                
                $weeksPresent = $attendance ? $attendance->weeks_present : 0;
                $attendance30 = $attendance ? $attendance->attendance_30 : 0;
                
                // Create a simple attendance array for display (all weeks up to weeks_present are marked as present)
                $weeksAttendance = [];
                for ($i = 1; $i <= $maxWeeks; $i++) {
                    $weeksAttendance[$i] = $i <= $weeksPresent;
                }
                
            } else {
                // For second semester, use aggregated data (same as first semester)
                $attendance = $attendanceModel::where('user_id', $user->id)
                    ->where('semester', $semester)
                    ->first();
                
                $weeksPresent = $attendance ? $attendance->weeks_present : 0;
                $attendance30 = $attendance ? $attendance->attendance_30 : 0;
                
                // Create a simple attendance array for display (all weeks up to weeks_present are marked as present)
                $weeksAttendance = [];
                for ($i = 1; $i <= $maxWeeks; $i++) {
                    $weeksAttendance[$i] = $i <= $weeksPresent;
                }
            }
            
            // Calculate percentage for display purposes
            $attendancePercentage = $maxWeeks > 0 ? ($weeksPresent / $maxWeeks) * 100 : 0;
            
            $attendanceData[] = [
                'user_id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'company' => $user->company ?? '',
                'battalion' => $user->battalion ?? '',
                'platoon' => $user->platoon ?? '',
                'attendances' => $weeksAttendance,
                'weeks_present' => $weeksPresent,
                'attendance_30' => $attendance30,
                'percentage' => round($attendancePercentage, 2),
                'max_weeks' => $maxWeeks,
            ];
        }

        return response()->json($attendanceData);
    }

    /**
     * Calculate attendance percentage.
     *
     * @param  array  $attendances
     * @return float
     */
    private function calculateAttendancePercentage($attendances)
    {
        $totalDays = count($attendances);
        $presentDays = count(array_filter($attendances, function($present) {
            return $present;
        }));

        if ($totalDays === 0) {
            return 0;
        }

        return round(($presentDays / $totalDays) * 100, 2);
    }

    /**
     * Update aggregated attendance data for a user.
     *
     * @param  int  $userId
     * @param  string  $semester
     * @return void
     */
    private function updateAggregatedAttendance($userId, $semester)
    {
        $attendanceModel = $this->getAttendanceModelForSemester($semester);
        $attendances = $attendanceModel::where('user_id', $userId)
            ->where('semester', $semester)
            ->get();
        
        $weeksPresent = $attendances->where('is_present', true)->count();
        
        // Calculate average based on semester
        $maxWeeks = $this->getMaxWeeksForSemester($semester);
        $average = $maxWeeks > 0 ? round(($weeksPresent / $maxWeeks) * 100, 2) : 0;
        
        // Calculate attendance_30 using average * 0.30
        $attendance30 = round($average * 0.30);
        
        // Store aggregated data in attendance table (update all records for this user/semester)
        $attendanceModel::where('user_id', $userId)
            ->where('semester', $semester)
            ->update([
                'weeks_present' => $weeksPresent,
                'attendance_30' => $attendance30,
                'average' => $average,
            ]);
    }
}
