<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AttendanceController extends Controller
{
    /**
     * Update attendance record for a user.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function updateAttendance(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'day_number' => 'required|integer|min:1|max:15',
            'is_present' => 'required|boolean',
        ]);

        // Check if record exists
        $attendance = Attendance::where('user_id', $request->user_id)
            ->where('day_number', $request->day_number)
            ->first();

        if ($attendance) {
            // Update existing record
            $attendance->is_present = $request->is_present;
            $attendance->save();
        } else {
            // Create new record
            Attendance::create([
                'user_id' => $request->user_id,
                'day_number' => $request->day_number,
                'is_present' => $request->is_present,
                'attendance_date' => now()->toDateString(),
            ]);
        }

        return response()->json(['success' => true]);
    }

    /**
     * Get all attendance records for a specific user.
     *
     * @param  int  $userId
     * @return \Illuminate\Http\Response
     */
    public function getUserAttendance($userId)
    {
        $attendances = Attendance::where('user_id', $userId)->get();
        return response()->json($attendances);
    }

    /**
     * Get all attendance records.
     *
     * @return \Illuminate\Http\Response
     */
    public function getAllAttendance()
    {
        // Get all users with role 'user' (cadets)
        $users = User::where('role', 'user')->get();
        \Log::info('Getting attendance for ' . $users->count() . ' cadets');
        $attendanceData = [];

        foreach ($users as $user) {
            $attendances = $user->attendances()->get();
            
            // Create an array with 15 days
            $daysAttendance = [];
            for ($i = 1; $i <= 15; $i++) {
                $record = $attendances->where('day_number', $i)->first();
                $daysAttendance[$i] = $record ? $record->is_present : false;
            }
            
            $attendanceData[] = [
                'user_id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'company' => $user->company ?? '',
                'battalion' => $user->battalion ?? '',
                'platoon' => $user->platoon ?? '',
                'attendances' => $daysAttendance,
                'percentage' => $this->calculateAttendancePercentage($daysAttendance),
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
}
