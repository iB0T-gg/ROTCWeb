<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Check if the semester column exists before trying to query it
        if (!Schema::hasColumn('first_semester_exam_scores', 'semester')) {
            return; // Skip this migration if the column doesn't exist
        }
        
        // Move any mistakenly stored 2nd semester rows from first_semester_exam_scores
        // into second_semester_exam_scores, then delete them from the source table.
        $rows = DB::table('first_semester_exam_scores')
            ->where('semester', 'like', '%2nd semester%')
            ->get();

        foreach ($rows as $row) {
            // Upsert into second_semester_exam_scores
            DB::table('second_semester_exam_scores')->updateOrInsert(
                [
                    'user_id' => $row->user_id,
                    'semester' => $row->semester,
                ],
                [
                    'midterm_exam' => $row->midterm_exam,
                    'final_exam' => $row->final_exam,
                    'created_at' => $row->created_at,
                    'updated_at' => $row->updated_at,
                ]
            );
        }

        // Delete the moved rows from the first semester table
        DB::table('first_semester_exam_scores')
            ->where('semester', 'like', '%2nd semester%')
            ->delete();
    }

    public function down(): void
    {
        // Reverse: move back any rows with 2nd semester from second to first (unlikely needed)
        $rows = DB::table('second_semester_exam_scores')
            ->where('semester', 'like', '%2nd semester%')
            ->get();

        foreach ($rows as $row) {
            DB::table('first_semester_exam_scores')->updateOrInsert(
                [
                    'user_id' => $row->user_id,
                    'semester' => $row->semester,
                ],
                [
                    'midterm_exam' => $row->midterm_exam,
                    'final_exam' => $row->final_exam,
                    'created_at' => $row->created_at,
                    'updated_at' => $row->updated_at,
                ]
            );
        }

        DB::table('second_semester_exam_scores')
            ->where('semester', 'like', '%2nd semester%')
            ->delete();
    }
};


