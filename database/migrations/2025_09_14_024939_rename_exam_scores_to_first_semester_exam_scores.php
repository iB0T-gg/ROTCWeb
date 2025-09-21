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
        // Rename the exam_scores table to first_semester_exam_scores
        Schema::rename('exam_scores', 'first_semester_exam_scores');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Rename back to exam_scores
        Schema::rename('first_semester_exam_scores', 'exam_scores');
    }
};