<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('first_semester_exam_scores', function (Blueprint $table) {
            // First, rename final_exam to average to avoid conflict
            if (Schema::hasColumn('first_semester_exam_scores', 'final_exam')) {
                $table->renameColumn('final_exam', 'average');
            }
            
            // Then rename midterm_exam to final_exam
            if (Schema::hasColumn('first_semester_exam_scores', 'midterm_exam')) {
                $table->renameColumn('midterm_exam', 'final_exam');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('first_semester_exam_scores', function (Blueprint $table) {
            // Reverse the column renames in opposite order
            if (Schema::hasColumn('first_semester_exam_scores', 'final_exam')) {
                $table->renameColumn('final_exam', 'midterm_exam');
            }
            
            if (Schema::hasColumn('first_semester_exam_scores', 'average')) {
                $table->renameColumn('average', 'final_exam');
            }
        });
    }
};
