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
        Schema::table('first_semester_aptitude', function (Blueprint $table) {
            $cols = [
                'merits_week_11', 'demerits_week_11',
                'merits_week_12', 'demerits_week_12',
                'merits_week_13', 'demerits_week_13',
                'merits_week_14', 'demerits_week_14',
                'merits_week_15', 'demerits_week_15',
            ];
            foreach ($cols as $col) {
                if (Schema::hasColumn('first_semester_aptitude', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('first_semester_aptitude', function (Blueprint $table) {
            // Re-add columns as nullable strings
            $columnsToAdd = [
                'merits_week_11', 'demerits_week_11',
                'merits_week_12', 'demerits_week_12',
                'merits_week_13', 'demerits_week_13',
                'merits_week_14', 'demerits_week_14',
                'merits_week_15', 'demerits_week_15',
            ];
            foreach ($columnsToAdd as $col) {
                if (!Schema::hasColumn('first_semester_aptitude', $col)) {
                    $table->string($col)->nullable();
                }
            }
        });
    }
};
