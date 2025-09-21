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
        // The table structure is already correct from previous migrations
        // Just add the unique constraint if it doesn't exist and if the columns exist
        if (Schema::hasColumn('first_semester_exam_scores', 'user_id') && Schema::hasColumn('first_semester_exam_scores', 'semester')) {
            Schema::table('first_semester_exam_scores', function (Blueprint $table) {
                $table->unique(['user_id', 'semester']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('first_semester_exam_scores', function (Blueprint $table) {
            $table->dropUnique(['user_id', 'semester']);
        });
    }
};