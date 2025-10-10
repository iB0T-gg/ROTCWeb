<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\UserGrade;
use App\Models\Merit;
use App\Models\SecondSemesterMerit;
use App\Models\Attendance;
use App\Models\SecondSemesterAttendance;
use App\Models\ExamScore;
use App\Models\SecondSemesterExamScore;
use Illuminate\Support\Facades\DB;

class RotcGradeController extends Controller
{
    /**
     * Get ROTC grades for all cadets in a specific semester
     */
    public function getRotcGrades(Request $request)
    {
        $semester = $request->input('semester', '2025-2026 1st semester');
        
        try {
            $cadets = User::where('role', 'user')
                ->where('archived', false)
                ->select('id', 'first_name', 'last_name', 'middle_name', 'platoon', 'company', 'battalion')
                ->get();

            $gradesData = [];

            foreach ($cadets as $cadet) {
                $gradeData = $this->calculateIndividualGrade($cadet->id, $semester);
                $gradeData['cadet'] = $cadet;
                $gradesData[] = $gradeData;
            }

            return response()->json([
                'success' => true,
                'semester' => $semester,
                'grades' => $gradesData
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching ROTC grades: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Calculate individual cadet's grade breakdown
     */
    private function calculateIndividualGrade($userId, $semester)
    {
        $isFirstSemester = strpos($semester, '1st semester') !== false;
        
        // Initialize scores
        $aptitudeScore = 0;
        $attendanceScore = 0;
        $examScore = 0;
        
        // Get aptitude score (30%)
        if ($isFirstSemester) {
            $aptitude = Merit::where('cadet_id', $userId)
                ->where('type', 'military_attitude')
                ->first();
            $aptitudeScore = $aptitude ? $aptitude->aptitude_30 : 0;
        } else {
            $aptitude = SecondSemesterMerit::where('cadet_id', $userId)
                ->where('type', 'military_attitude')
                ->first();
            $aptitudeScore = $aptitude ? $aptitude->aptitude_30 : 0;
        }

        // Get attendance score (30%)
        if ($isFirstSemester) {
            $attendance = Attendance::where('user_id', $userId)
                ->where('semester', $semester)
                ->first();
            $attendanceScore = $attendance ? $attendance->attendance_30 : 0;
        } else {
            $attendance = SecondSemesterAttendance::where('user_id', $userId)
                ->where('semester', $semester)
                ->first();
            $attendanceScore = $attendance ? $attendance->attendance_30 : 0;
        }

        // Get exam score (40%)
        if ($isFirstSemester) {
            $exam = ExamScore::where('user_id', $userId)
                ->where('semester', $semester)
                ->first();
            if ($exam && $exam->average) {
                $examScore = min(40, round($exam->average * 0.40));
            }
        } else {
            $exam = SecondSemesterExamScore::where('user_id', $userId)
                ->where('semester', $semester)
                ->first();
            if ($exam && $exam->average) {
                $examScore = min(40, round($exam->average * 0.40));
            }
        }

        // Calculate final grade
        $finalGrade = $aptitudeScore + $attendanceScore + $examScore;
        $equivalentGrade = UserGrade::calculateEquivalentGrade($finalGrade);
        $remarks = ($equivalentGrade >= 1.00 && $equivalentGrade <= 3.00) ? 'Passed' : 'Failed';

        return [
            'user_id' => $userId,
            'aptitude_score' => $aptitudeScore,
            'attendance_score' => $attendanceScore,
            'exam_score' => $examScore,
            'final_grade' => $finalGrade,
            'equivalent_grade' => $equivalentGrade,
            'remarks' => $remarks,
            'semester' => $semester
        ];
    }

    /**
     * Calculate and save ROTC grades for a semester
     */
    public function calculateAndSaveGrades(Request $request)
    {
        $request->validate([
            'semester' => 'required|string'
        ]);

        $semester = $request->input('semester');
        
        try {
            DB::beginTransaction();

            $cadets = User::where('role', 'user')
                ->where('archived', false)
                ->get();
            $updated = 0;

            foreach ($cadets as $cadet) {
                $gradeData = $this->calculateIndividualGrade($cadet->id, $semester);
                
                // Store the grade in the database
                UserGrade::updateOrCreate(
                    [
                        'user_id' => $cadet->id,
                        'semester' => $semester
                    ],
                    [
                        'final_grade' => $gradeData['final_grade'],
                        'equivalent_grade' => $gradeData['equivalent_grade'],
                        'remarks' => $gradeData['remarks']
                    ]
                );
                
                $updated++;
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "Successfully calculated and saved grades for {$updated} cadets",
                'updated_count' => $updated,
                'semester' => $semester
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error calculating grades: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get stored ROTC grades from the database
     */
    public function getStoredGrades(Request $request)
    {
        $semester = $request->input('semester', '2025-2026 1st semester');
        
        try {
            $grades = UserGrade::with('user:id,first_name,last_name,middle_name,platoon,company,battalion')
                ->where('semester', $semester)
                ->get();

            return response()->json([
                'success' => true,
                'semester' => $semester,
                'grades' => $grades
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching stored grades: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get grade breakdown for a specific cadet
     */
    public function getCadetGradeBreakdown($userId, Request $request)
    {
        $semester = $request->input('semester', '2025-2026 1st semester');
        
        try {
            $cadet = User::find($userId);
            
            if (!$cadet || $cadet->role !== 'user') {
                return response()->json([
                    'success' => false,
                    'message' => 'Cadet not found'
                ], 404);
            }

            $gradeData = $this->calculateIndividualGrade($userId, $semester);
            $gradeData['cadet'] = $cadet;

            return response()->json([
                'success' => true,
                'data' => $gradeData
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching cadet grade breakdown: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Recalculate all grades for a semester (useful for updates)
     */
    public function recalculateAllGrades(Request $request)
    {
        $request->validate([
            'semester' => 'required|string'
        ]);

        $semester = $request->input('semester');
        
        try {
            $updated = UserGrade::recalculateAllGrades($semester);

            return response()->json([
                'success' => true,
                'message' => "Successfully recalculated grades for {$updated} cadets",
                'updated_count' => $updated,
                'semester' => $semester
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error recalculating grades: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get summary statistics for grades in a semester
     */
    public function getGradeSummary(Request $request)
    {
        $semester = $request->input('semester', '2025-2026 1st semester');
        
        try {
            $stats = UserGrade::where('semester', $semester)
                ->selectRaw('
                    COUNT(*) as total_cadets,
                    AVG(final_grade) as average_final_grade,
                    AVG(equivalent_grade) as average_equivalent_grade,
                    COUNT(CASE WHEN remarks = "Passed" THEN 1 END) as passed_count,
                    COUNT(CASE WHEN remarks = "Failed" THEN 1 END) as failed_count,
                    MIN(final_grade) as lowest_final_grade,
                    MAX(final_grade) as highest_final_grade
                ')
                ->first();

            return response()->json([
                'success' => true,
                'semester' => $semester,
                'statistics' => $stats
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching grade summary: ' . $e->getMessage()
            ], 500);
        }
    }
}