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
            // Add user_id column if it doesn't exist
            if (!Schema::hasColumn('first_semester_exam_scores', 'user_id')) {
                $table->unsignedBigInteger('user_id')->nullable();
                $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            }
            
            // Add semester column if it doesn't exist
            if (!Schema::hasColumn('first_semester_exam_scores', 'semester')) {
                $table->string('semester')->nullable();
            }
            
            // Add midterm_exam column if it doesn't exist
            if (!Schema::hasColumn('first_semester_exam_scores', 'midterm_exam')) {
                $table->integer('midterm_exam')->nullable();
            }
            
            // Add final_exam column if it doesn't exist
            if (!Schema::hasColumn('first_semester_exam_scores', 'final_exam')) {
                $table->integer('final_exam')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('first_semester_exam_scores', function (Blueprint $table) {
            // Drop foreign key constraint first
            if (Schema::hasColumn('first_semester_exam_scores', 'user_id')) {
                $table->dropForeign(['user_id']);
            }
            
            // Drop columns if they exist
            if (Schema::hasColumn('first_semester_exam_scores', 'user_id')) {
                $table->dropColumn('user_id');
            }
            if (Schema::hasColumn('first_semester_exam_scores', 'semester')) {
                $table->dropColumn('semester');
            }
            if (Schema::hasColumn('first_semester_exam_scores', 'midterm_exam')) {
                $table->dropColumn('midterm_exam');
            }
            if (Schema::hasColumn('first_semester_exam_scores', 'final_exam')) {
                $table->dropColumn('final_exam');
            }
        });
    }
};
