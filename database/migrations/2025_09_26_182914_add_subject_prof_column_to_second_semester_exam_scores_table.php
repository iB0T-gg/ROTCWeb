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
            $table->decimal('subject_prof', 5, 2)->default(0.00)->after('average')->comment('Subject Prof. 40% score');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('second_semester_exam_scores', function (Blueprint $table) {
            $table->dropColumn('subject_prof');
        });
    }
};
