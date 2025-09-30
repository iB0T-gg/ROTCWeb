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
        // For MySQL we need to check if the index exists before trying to drop it
        if (config('database.default') === 'mysql') {
            $indexExists = false;
            try {
                // Check if the index exists
                $indexExists = DB::select("SHOW INDEX FROM first_semester_exam_scores WHERE Key_name = 'first_semester_exam_scores_user_id_semester_unique'");
            } catch (\Exception $e) {
                // Table might not exist, so we can ignore this error
            }
            
            if (!empty($indexExists)) {
                Schema::table('first_semester_exam_scores', function (Blueprint $table) {
                    $table->dropUnique(['user_id', 'semester']);
                });
            }
        } else {
            // For SQLite, just try to drop it directly
            Schema::table('first_semester_exam_scores', function (Blueprint $table) {
                try {
                    $table->dropUnique(['user_id', 'semester']);
                } catch (\Exception $e) {
                    // Ignore if index doesn't exist
                }
            });
        }
    }
};