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
        // Add midterm_exam column to first_semester_exam_scores table
        Schema::table('first_semester_exam_scores', function (Blueprint $table) {
            if (!Schema::hasColumn('first_semester_exam_scores', 'midterm_exam')) {
                $table->integer('midterm_exam')->nullable();
            }
        });

        // Add midterm_exam column to second_semester_exam_scores table
        Schema::table('second_semester_exam_scores', function (Blueprint $table) {
            if (!Schema::hasColumn('second_semester_exam_scores', 'midterm_exam')) {
                $table->integer('midterm_exam')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove midterm_exam column from first_semester_exam_scores table
        Schema::table('first_semester_exam_scores', function (Blueprint $table) {
            if (Schema::hasColumn('first_semester_exam_scores', 'midterm_exam')) {
                $table->dropColumn('midterm_exam');
            }
        });

        // Remove midterm_exam column from second_semester_exam_scores table
        Schema::table('second_semester_exam_scores', function (Blueprint $table) {
            if (Schema::hasColumn('second_semester_exam_scores', 'midterm_exam')) {
                $table->dropColumn('midterm_exam');
            }
        });
    }
};