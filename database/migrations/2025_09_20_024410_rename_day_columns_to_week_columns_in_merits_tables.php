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
        // Rename columns in first_semester_merits table
        Schema::table('first_semester_merits', function (Blueprint $table) {
            $table->renameColumn('day_1', 'week_1');
            $table->renameColumn('day_2', 'week_2');
            $table->renameColumn('day_3', 'week_3');
            $table->renameColumn('day_4', 'week_4');
            $table->renameColumn('day_5', 'week_5');
            $table->renameColumn('day_6', 'week_6');
            $table->renameColumn('day_7', 'week_7');
            $table->renameColumn('day_8', 'week_8');
            $table->renameColumn('day_9', 'week_9');
            $table->renameColumn('day_10', 'week_10');
            $table->renameColumn('day_11', 'week_11');
            $table->renameColumn('day_12', 'week_12');
            $table->renameColumn('day_13', 'week_13');
            $table->renameColumn('day_14', 'week_14');
            $table->renameColumn('day_15', 'week_15');
        });

        // Rename columns in second_semester_merits table
        Schema::table('second_semester_merits', function (Blueprint $table) {
            $table->renameColumn('day_1', 'week_1');
            $table->renameColumn('day_2', 'week_2');
            $table->renameColumn('day_3', 'week_3');
            $table->renameColumn('day_4', 'week_4');
            $table->renameColumn('day_5', 'week_5');
            $table->renameColumn('day_6', 'week_6');
            $table->renameColumn('day_7', 'week_7');
            $table->renameColumn('day_8', 'week_8');
            $table->renameColumn('day_9', 'week_9');
            $table->renameColumn('day_10', 'week_10');
            $table->renameColumn('day_11', 'week_11');
            $table->renameColumn('day_12', 'week_12');
            $table->renameColumn('day_13', 'week_13');
            $table->renameColumn('day_14', 'week_14');
            $table->renameColumn('day_15', 'week_15');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reverse column renames in first_semester_merits table
        Schema::table('first_semester_merits', function (Blueprint $table) {
            $table->renameColumn('week_1', 'day_1');
            $table->renameColumn('week_2', 'day_2');
            $table->renameColumn('week_3', 'day_3');
            $table->renameColumn('week_4', 'day_4');
            $table->renameColumn('week_5', 'day_5');
            $table->renameColumn('week_6', 'day_6');
            $table->renameColumn('week_7', 'day_7');
            $table->renameColumn('week_8', 'day_8');
            $table->renameColumn('week_9', 'day_9');
            $table->renameColumn('week_10', 'day_10');
            $table->renameColumn('week_11', 'day_11');
            $table->renameColumn('week_12', 'day_12');
            $table->renameColumn('week_13', 'day_13');
            $table->renameColumn('week_14', 'day_14');
            $table->renameColumn('week_15', 'day_15');
        });

        // Reverse column renames in second_semester_merits table
        Schema::table('second_semester_merits', function (Blueprint $table) {
            $table->renameColumn('week_1', 'day_1');
            $table->renameColumn('week_2', 'day_2');
            $table->renameColumn('week_3', 'day_3');
            $table->renameColumn('week_4', 'day_4');
            $table->renameColumn('week_5', 'day_5');
            $table->renameColumn('week_6', 'day_6');
            $table->renameColumn('week_7', 'day_7');
            $table->renameColumn('week_8', 'day_8');
            $table->renameColumn('week_9', 'day_9');
            $table->renameColumn('week_10', 'day_10');
            $table->renameColumn('week_11', 'day_11');
            $table->renameColumn('week_12', 'day_12');
            $table->renameColumn('week_13', 'day_13');
            $table->renameColumn('week_14', 'day_14');
            $table->renameColumn('week_15', 'day_15');
        });
    }
};
