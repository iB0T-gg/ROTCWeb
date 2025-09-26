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
        Schema::table('second_semester_exam_scores', function (Blueprint $table) {
            // First, round all existing decimal values to integers
            DB::statement('UPDATE second_semester_exam_scores SET subject_prof = ROUND(subject_prof) WHERE subject_prof IS NOT NULL');
            
            // Change the column type from decimal to integer
            $table->integer('subject_prof')->default(0)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('second_semester_exam_scores', function (Blueprint $table) {
            // Change back to decimal
            $table->decimal('subject_prof', 5, 2)->default(0.00)->change();
        });
    }
};