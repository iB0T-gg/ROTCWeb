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
        if (Schema::hasColumn('first_semester_exam_scores', 'midterm_exam')) {
            Schema::table('first_semester_exam_scores', function (Blueprint $table) {
                $table->dropColumn('midterm_exam');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasColumn('first_semester_exam_scores', 'midterm_exam')) {
            Schema::table('first_semester_exam_scores', function (Blueprint $table) {
                $table->integer('midterm_exam')->nullable()->after('final_exam');
            });
        }
    }
};
