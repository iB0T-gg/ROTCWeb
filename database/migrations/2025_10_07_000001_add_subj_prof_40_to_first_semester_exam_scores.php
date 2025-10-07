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
            if (!Schema::hasColumn('first_semester_exam_scores', 'subj_prof_40')) {
                $table->unsignedInteger('subj_prof_40')->nullable()->after('average');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('first_semester_exam_scores', function (Blueprint $table) {
            if (Schema::hasColumn('first_semester_exam_scores', 'subj_prof_40')) {
                $table->dropColumn('subj_prof_40');
            }
        });
    }
};


