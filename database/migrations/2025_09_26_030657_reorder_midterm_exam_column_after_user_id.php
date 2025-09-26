<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Reorder first_semester_exam_scores table
        $this->reorderFirstSemesterTable();
        
        // Reorder second_semester_exam_scores table
        $this->reorderSecondSemesterTable();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reorder first_semester_exam_scores table back to original
        $this->reorderFirstSemesterTableBack();
        
        // Reorder second_semester_exam_scores table back to original
        $this->reorderSecondSemesterTableBack();
    }

    private function reorderFirstSemesterTable(): void
    {
        // For first_semester_exam_scores, we need to move midterm_exam after user_id
        // Current order: id, created_at, updated_at, user_id, semester, final_exam, average, midterm_exam
        // Desired order: id, created_at, updated_at, user_id, midterm_exam, semester, final_exam, average
        
        Schema::table('first_semester_exam_scores', function (Blueprint $table) {
            // Move midterm_exam to after user_id
            $table->integer('midterm_exam')->nullable()->after('user_id')->change();
        });
    }

    private function reorderSecondSemesterTable(): void
    {
        // For second_semester_exam_scores, we need to move midterm_exam after user_id
        // Current order: id, user_id, final_exam, average, semester, created_at, updated_at, midterm_exam
        // Desired order: id, user_id, midterm_exam, final_exam, average, semester, created_at, updated_at
        
        Schema::table('second_semester_exam_scores', function (Blueprint $table) {
            // Move midterm_exam to after user_id
            $table->integer('midterm_exam')->nullable()->after('user_id')->change();
        });
    }

    private function reorderFirstSemesterTableBack(): void
    {
        // Move midterm_exam back to the end
        Schema::table('first_semester_exam_scores', function (Blueprint $table) {
            $table->integer('midterm_exam')->nullable()->after('average')->change();
        });
    }

    private function reorderSecondSemesterTableBack(): void
    {
        // Move midterm_exam back to the end
        Schema::table('second_semester_exam_scores', function (Blueprint $table) {
            $table->integer('midterm_exam')->nullable()->after('updated_at')->change();
        });
    }
};