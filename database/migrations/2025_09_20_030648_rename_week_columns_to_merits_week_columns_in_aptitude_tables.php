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
        // Rename columns in first_semester_aptitude table
        Schema::table('first_semester_aptitude', function (Blueprint $table) {
            $table->renameColumn('week_1', 'merits_week_1');
            $table->renameColumn('week_2', 'merits_week_2');
            $table->renameColumn('week_3', 'merits_week_3');
            $table->renameColumn('week_4', 'merits_week_4');
            $table->renameColumn('week_5', 'merits_week_5');
            $table->renameColumn('week_6', 'merits_week_6');
            $table->renameColumn('week_7', 'merits_week_7');
            $table->renameColumn('week_8', 'merits_week_8');
            $table->renameColumn('week_9', 'merits_week_9');
            $table->renameColumn('week_10', 'merits_week_10');
            $table->renameColumn('week_11', 'merits_week_11');
            $table->renameColumn('week_12', 'merits_week_12');
            $table->renameColumn('week_13', 'merits_week_13');
            $table->renameColumn('week_14', 'merits_week_14');
            $table->renameColumn('week_15', 'merits_week_15');
        });

        // Rename columns in second_semester_aptitude table
        Schema::table('second_semester_aptitude', function (Blueprint $table) {
            $table->renameColumn('week_1', 'merits_week_1');
            $table->renameColumn('week_2', 'merits_week_2');
            $table->renameColumn('week_3', 'merits_week_3');
            $table->renameColumn('week_4', 'merits_week_4');
            $table->renameColumn('week_5', 'merits_week_5');
            $table->renameColumn('week_6', 'merits_week_6');
            $table->renameColumn('week_7', 'merits_week_7');
            $table->renameColumn('week_8', 'merits_week_8');
            $table->renameColumn('week_9', 'merits_week_9');
            $table->renameColumn('week_10', 'merits_week_10');
            $table->renameColumn('week_11', 'merits_week_11');
            $table->renameColumn('week_12', 'merits_week_12');
            $table->renameColumn('week_13', 'merits_week_13');
            $table->renameColumn('week_14', 'merits_week_14');
            $table->renameColumn('week_15', 'merits_week_15');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reverse column renames in first_semester_aptitude table
        Schema::table('first_semester_aptitude', function (Blueprint $table) {
            $table->renameColumn('merits_week_1', 'week_1');
            $table->renameColumn('merits_week_2', 'week_2');
            $table->renameColumn('merits_week_3', 'week_3');
            $table->renameColumn('merits_week_4', 'week_4');
            $table->renameColumn('merits_week_5', 'week_5');
            $table->renameColumn('merits_week_6', 'week_6');
            $table->renameColumn('merits_week_7', 'week_7');
            $table->renameColumn('merits_week_8', 'week_8');
            $table->renameColumn('merits_week_9', 'week_9');
            $table->renameColumn('merits_week_10', 'week_10');
            $table->renameColumn('merits_week_11', 'week_11');
            $table->renameColumn('merits_week_12', 'week_12');
            $table->renameColumn('merits_week_13', 'week_13');
            $table->renameColumn('merits_week_14', 'week_14');
            $table->renameColumn('merits_week_15', 'week_15');
        });

        // Reverse column renames in second_semester_aptitude table
        Schema::table('second_semester_aptitude', function (Blueprint $table) {
            $table->renameColumn('merits_week_1', 'week_1');
            $table->renameColumn('merits_week_2', 'week_2');
            $table->renameColumn('merits_week_3', 'week_3');
            $table->renameColumn('merits_week_4', 'week_4');
            $table->renameColumn('merits_week_5', 'week_5');
            $table->renameColumn('merits_week_6', 'week_6');
            $table->renameColumn('merits_week_7', 'week_7');
            $table->renameColumn('merits_week_8', 'week_8');
            $table->renameColumn('merits_week_9', 'week_9');
            $table->renameColumn('merits_week_10', 'week_10');
            $table->renameColumn('merits_week_11', 'week_11');
            $table->renameColumn('merits_week_12', 'week_12');
            $table->renameColumn('merits_week_13', 'week_13');
            $table->renameColumn('merits_week_14', 'week_14');
            $table->renameColumn('merits_week_15', 'week_15');
        });
    }
};
