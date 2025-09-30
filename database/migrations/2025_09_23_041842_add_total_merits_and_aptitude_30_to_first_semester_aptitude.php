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
        // Check if columns already exist (they might have been added by another migration)
        $totalMeritsExists = Schema::hasColumn('first_semester_aptitude', 'total_merits');
        $aptitude30Exists = Schema::hasColumn('first_semester_aptitude', 'aptitude_30');
        
        // Only proceed if columns don't already exist
        if (!$totalMeritsExists || !$aptitude30Exists) {
            Schema::table('first_semester_aptitude', function (Blueprint $table) use ($totalMeritsExists, $aptitude30Exists) {
                // Add after demerits_week_10 since percentage column doesn't exist
                if (!$totalMeritsExists) {
                    $table->integer('total_merits')->default(0)->after('demerits_week_10');
                }
                
                if (!$aptitude30Exists) {
                    // If total_merits exists, add after it; otherwise add after demerits_week_10
                    $afterColumn = $totalMeritsExists ? 'total_merits' : 'demerits_week_10';
                    $table->decimal('aptitude_30', 5, 2)->default(0.00)->after($afterColumn);
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('first_semester_aptitude', function (Blueprint $table) {
            // Check if columns exist before trying to drop them
            $columnsToDrop = [];
            
            if (Schema::hasColumn('first_semester_aptitude', 'total_merits')) {
                $columnsToDrop[] = 'total_merits';
            }
            
            if (Schema::hasColumn('first_semester_aptitude', 'aptitude_30')) {
                $columnsToDrop[] = 'aptitude_30';
            }
            
            if (!empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};