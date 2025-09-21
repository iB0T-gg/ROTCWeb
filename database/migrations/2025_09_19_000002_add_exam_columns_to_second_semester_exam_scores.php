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
        Schema::table('second_semester_exam_scores', function (Blueprint $table) {
            // Add midterm_exam column if it doesn't exist
            if (!Schema::hasColumn('second_semester_exam_scores', 'midterm_exam')) {
                $table->integer('midterm_exam')->nullable();
            }
            
            // Add final_exam column if it doesn't exist
            if (!Schema::hasColumn('second_semester_exam_scores', 'final_exam')) {
                $table->integer('final_exam')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('second_semester_exam_scores', function (Blueprint $table) {
            if (Schema::hasColumn('second_semester_exam_scores', 'midterm_exam')) {
                $table->dropColumn('midterm_exam');
            }
            if (Schema::hasColumn('second_semester_exam_scores', 'final_exam')) {
                $table->dropColumn('final_exam');
            }
        });
    }
};
