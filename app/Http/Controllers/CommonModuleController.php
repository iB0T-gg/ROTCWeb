<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\FirstSemesterCommonGrade;

class CommonModuleController extends Controller
{
    public function get(Request $request)
    {
        $semester = $request->query('semester', '2025-2026 1st semester');
        $grades = FirstSemesterCommonGrade::where('semester', $semester)->get();
        $map = [];
        foreach ($grades as $g) {
            $map[$g->user_id] = $g->common_module_grade;
        }
        return response()->json($map);
    }

    public function save(Request $request)
    {
        $semester = $request->input('semester', '2025-2026 1st semester');
        $data = $request->input('grades', []);
        foreach ($data as $row) {
            if (!isset($row['user_id'])) continue;
            FirstSemesterCommonGrade::updateOrCreate(
                ['user_id' => $row['user_id'], 'semester' => $semester],
                ['common_module_grade' => $row['common_module_grade']]
            );
        }
        
        // Clear any relevant caches to ensure fresh data
        \Cache::forget("final_grades_{$semester}");
        \Cache::forget("common_module_{$semester}");
        
        return response()->json(['status' => 'ok']);
    }
}


